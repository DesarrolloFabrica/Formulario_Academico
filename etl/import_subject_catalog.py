from __future__ import annotations

import argparse
import os
import re
import unicodedata
from pathlib import Path

import pandas as pd
import psycopg


REQUIRED_COLUMNS = {
    "materias": "subject_name",
    "codigo": "code",
    "semestre": "semester",
    "ciclo": "cycle",
    "programa": "program_name",
}

CYCLE_ALIASES = {
    "profesional": "Profesional",
    "tecnico": "Tecnico",
    "tecnica": "Tecnico",
    "tecnologia": "Tecnologo",
    "tecnologo": "Tecnologo",
}


def normalize_header(value: str) -> str:
    text = unicodedata.normalize("NFKD", str(value).strip().lower())
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"\s+", " ", text)
    return text


def clean_text(value: object) -> str:
    return re.sub(r"\s+", " ", str(value).strip())


def clean_semester(value: object) -> str:
    text = clean_text(value)
    if re.fullmatch(r"\d+\.0", text):
        return text[:-2]
    return text


def normalize_cycle(value: object) -> str:
    text = clean_text(value)
    key = normalize_header(text)
    if key not in CYCLE_ALIASES:
        raise ValueError(f"Ciclo no soportado: {text}. Valores permitidos: Profesional, Tecnico, Tecnologo")
    return CYCLE_ALIASES[key]


def load_env(env_path: Path) -> None:
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def read_catalog(excel_path: Path, sheet_name: str | int | None) -> pd.DataFrame:
    df = pd.read_excel(excel_path, sheet_name=sheet_name or 0, dtype=str, keep_default_na=False)
    renamed: dict[str, str] = {}

    for column in df.columns:
        normalized = normalize_header(column)
        if normalized in REQUIRED_COLUMNS:
            renamed[column] = REQUIRED_COLUMNS[normalized]

    df = df.rename(columns=renamed)
    missing = sorted(set(REQUIRED_COLUMNS.values()) - set(df.columns))
    if missing:
        expected = ", ".join(REQUIRED_COLUMNS.keys())
        raise ValueError(f"Faltan columnas requeridas: {missing}. Columnas esperadas: {expected}")

    df = df[list(REQUIRED_COLUMNS.values())].copy()
    for column in ["subject_name", "code", "program_name"]:
        df[column] = df[column].map(clean_text)
    df["semester"] = df["semester"].map(clean_semester)
    df["cycle"] = df["cycle"].map(normalize_cycle)

    df = df[
        (df["subject_name"] != "")
        & (df["code"] != "")
        & (df["semester"] != "")
        & (df["cycle"] != "")
        & (df["program_name"] != "")
    ].drop_duplicates()

    return df


def upsert_program(conn: psycopg.Connection, name: str) -> int:
    row = conn.execute(
        """
        INSERT INTO academic_programs (name, active)
        VALUES (%s, TRUE)
        ON CONFLICT (name)
        DO UPDATE SET active = TRUE
        RETURNING id
        """,
        (name,),
    ).fetchone()
    return int(row[0])


def upsert_semester(conn: psycopg.Connection, name: str) -> int:
    row = conn.execute(
        """
        INSERT INTO academic_semesters (name, active)
        VALUES (%s, TRUE)
        ON CONFLICT (name)
        DO UPDATE SET active = TRUE
        RETURNING id
        """,
        (name,),
    ).fetchone()
    return int(row[0])


def upsert_cycle(conn: psycopg.Connection, name: str) -> int:
    row = conn.execute(
        """
        INSERT INTO cycles (name, active)
        VALUES (%s, TRUE)
        ON CONFLICT (name)
        DO UPDATE SET active = TRUE
        RETURNING id
        """,
        (name,),
    ).fetchone()
    return int(row[0])


def upsert_subject(
    conn: psycopg.Connection,
    *,
    program_id: int,
    semester_id: int,
    cycle_id: int,
    code: str,
    name: str,
) -> None:
    existing = conn.execute(
        """
        SELECT id
        FROM subjects
        WHERE program_id = %s
          AND semester_id = %s
          AND lower(trim(code)) = lower(trim(%s))
        LIMIT 1
        """,
        (program_id, semester_id, code),
    ).fetchone()

    if existing:
        conn.execute(
            """
            UPDATE subjects
            SET name = %s,
                cycle_id = %s,
                active = TRUE
            WHERE id = %s
            """,
            (name, cycle_id, existing[0]),
        )
        return

    conn.execute(
        """
        INSERT INTO subjects (program_id, semester_id, cycle_id, code, name, active)
        VALUES (%s, %s, %s, %s, %s, TRUE)
        """,
        (program_id, semester_id, cycle_id, code, name),
    )


def import_catalog(df: pd.DataFrame, database_url: str, dry_run: bool) -> None:
    with psycopg.connect(database_url) as conn:
        try:
            conn.execute("BEGIN")
            program_ids = {name: upsert_program(conn, name) for name in sorted(df["program_name"].unique())}
            semester_ids = {
                name: upsert_semester(conn, name)
                for name in sorted(df["semester"].unique(), key=lambda value: int(value) if value.isdigit() else value)
            }
            cycle_ids = {name: upsert_cycle(conn, name) for name in ["Profesional", "Tecnico", "Tecnologo"]}

            for row in df.itertuples(index=False):
                upsert_subject(
                    conn,
                    program_id=program_ids[row.program_name],
                    semester_id=semester_ids[row.semester],
                    cycle_id=cycle_ids[row.cycle],
                    code=row.code,
                    name=row.subject_name,
                )

            if dry_run:
                conn.rollback()
                print("Dry run completado. No se guardaron cambios.")
            else:
                conn.commit()
                print("Carga completada.")
        except Exception:
            conn.rollback()
            raise

    print(f"Programas: {df['program_name'].nunique()}")
    print(f"Semestres: {df['semester'].nunique()}")
    print(f"Ciclos: {', '.join(sorted(df['cycle'].unique()))}")
    print(f"Materias: {len(df)}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Carga programas, semestres y materias desde Excel.")
    parser.add_argument("--excel", default="ASIGNATURAS CARRERAS (1).xlsx", help="Ruta del archivo Excel.")
    parser.add_argument("--sheet", default=None, help="Nombre de la hoja. Si se omite, usa la primera.")
    parser.add_argument("--env", default="back/.env", help="Archivo .env con DATABASE_URL.")
    parser.add_argument("--dry-run", action="store_true", help="Valida la carga sin guardar cambios.")
    args = parser.parse_args()

    load_env(Path(args.env))
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL no esta definido. Configuralo en back/.env o en el entorno.")

    excel_path = Path(args.excel)
    if not excel_path.exists():
        raise FileNotFoundError(f"No existe el Excel: {excel_path}")

    df = read_catalog(excel_path, args.sheet)
    import_catalog(df, database_url, args.dry_run)


if __name__ == "__main__":
    main()
