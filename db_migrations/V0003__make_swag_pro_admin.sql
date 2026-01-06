-- Назначить swag.pro@mail.ru администратором
UPDATE users 
SET is_admin = true 
WHERE email = 'swag.pro@mail.ru';