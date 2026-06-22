INSERT INTO professors (name)
VALUES
  ('Adriana Marcela Rios'),
  ('Carlos Eduardo Mendoza'),
  ('Diana Patricia Salazar'),
  ('Fernando Jose Alvarez'),
  ('Juliana Andrea Torres'),
  ('Luis Miguel Herrera'),
  ('Marcela Fernanda Castro'),
  ('Oscar Javier Pineda'),
  ('Paula Valentina Gomez'),
  ('Santiago Andres Ramirez')
ON CONFLICT (name) DO NOTHING;

INSERT INTO campuses (name)
VALUES
  ('Sede Centro'),
  ('Sede Norte'),
  ('Sede Sur'),
  ('Sede Occidente'),
  ('Sede Chapinero'),
  ('Sede Virtual'),
  ('Campus Tecnologico'),
  ('Campus Empresarial')
ON CONFLICT (name) DO NOTHING;
