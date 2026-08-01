-- Spilweb Full Database
-- VueJs 3 + Node.js + Express + MariaDB/MySQL
-- Domain: https://www.spilweb.net.tr
-- Contact: info@spilweb.net.tr

-- cPanel: Select the prefixed database in phpMyAdmin before importing this file.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ===== 001_initial_schema =====
CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  label VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY roles_name_unique (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid CHAR(36) NOT NULL DEFAULT (UUID()),
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(40) NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) NULL,
  language VARCHAR(8) NOT NULL DEFAULT 'tr',
  status ENUM('active', 'pending', 'suspended') NOT NULL DEFAULT 'active',
  email_verified_at TIMESTAMP NULL,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_uuid_unique (uuid),
  UNIQUE KEY users_email_unique (email),
  KEY users_status_index (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT user_roles_user_id_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT user_roles_role_id_fk FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(512) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY refresh_tokens_token_unique (token),
  KEY refresh_tokens_user_id_index (user_id),
  CONSTRAINT refresh_tokens_user_id_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS languages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(8) NOT NULL,
  name VARCHAR(80) NOT NULL,
  native_name VARCHAR(80) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY languages_code_unique (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(120) NOT NULL,
  `value` TEXT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'string',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY settings_key_unique (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (name, label)
VALUES
  ('super_admin', 'Super Admin'),
  ('admin', 'Admin'),
  ('editor', 'Editor'),
  ('customer', 'Customer')
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT INTO languages (code, name, native_name, is_default, is_active, sort_order)
VALUES
  ('tr', 'Turkish', 'Turkce', 1, 1, 1),
  ('en', 'English', 'English', 0, 1, 2)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  native_name = VALUES(native_name),
  is_default = VALUES(is_default),
  is_active = VALUES(is_active),
  sort_order = VALUES(sort_order);

INSERT INTO settings (`key`, `value`, type)
VALUES
  ('site_name', 'Spilweb', 'string'),
  ('site_url', 'https://www.spilweb.net.tr', 'string'),
  ('default_language', 'tr', 'string'),
  ('contact_email', 'info@spilweb.net.tr', 'string'),
  ('maintenance_mode', 'false', 'boolean')
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`),
  type = VALUES(type);

-- Normalize internal Spilweb accounts when upgrading an older installation.
UPDATE users AS legacy_account
LEFT JOIN users AS target_account
  ON target_account.email = CONCAT(
    SUBSTRING_INDEX(legacy_account.email, '@', 1),
    '@spilweb.net.tr'
  )
SET legacy_account.email = CONCAT(
  SUBSTRING_INDEX(legacy_account.email, '@', 1),
  '@spilweb.net.tr'
)
WHERE legacy_account.email LIKE '%@spilweb.%'
  AND legacy_account.email NOT LIKE '%@spilweb.net.tr'
  AND target_account.id IS NULL;


-- ===== 002_sprint_2_public_forms =====
CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  type ENUM('contact', 'quote') NOT NULL DEFAULT 'contact',
  name VARCHAR(190) NOT NULL,
  company VARCHAR(190) NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(40) NULL,
  subject VARCHAR(190) NOT NULL,
  service VARCHAR(120) NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new',
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY contact_messages_type_index (type),
  KEY contact_messages_status_index (status),
  KEY contact_messages_email_index (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===== 003_sprint_3_admin_cms =====
CREATE TABLE IF NOT EXISTS content_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  type ENUM('pages', 'services', 'portfolio', 'blog') NOT NULL,
  title VARCHAR(190) NOT NULL,
  slug VARCHAR(190) NOT NULL,
  excerpt VARCHAR(500) NULL,
  body LONGTEXT NULL,
  cover_image VARCHAR(255) NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY content_items_type_slug_unique (type, slug),
  KEY content_items_type_status_index (type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_files (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  folder VARCHAR(190) NULL,
  original_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  path VARCHAR(255) NOT NULL,
  alt_text VARCHAR(190) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY media_files_folder_index (folder),
  KEY media_files_mime_type_index (mime_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(120) NULL,
  entity_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY audit_logs_user_id_index (user_id),
  KEY audit_logs_entity_index (entity_type, entity_id),
  CONSTRAINT audit_logs_user_id_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO content_items (type, title, slug, excerpt, status, sort_order)
VALUES
  ('pages', 'Hakkımızda', 'hakkimizda', 'Spilweb marka ve ajans tanıtımı.', 'published', 1),
  ('services', 'Kurumsal Web Tasarım', 'kurumsal-web-tasarim', 'Modern ve responsive kurumsal web siteleri.', 'published', 1),
  ('portfolio', 'Atlas Kurumsal', 'atlas-kurumsal', 'Çok dilli kurumsal web vitrini.', 'published', 1),
  ('blog', 'Teknik SEO Temeli', 'teknik-seo-temeli', 'Meta, canonical ve performans notları.', 'draft', 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  excerpt = VALUES(excerpt),
  status = VALUES(status),
  sort_order = VALUES(sort_order);


-- ===== 004_sprint_4_enterprise_cms =====
CREATE TABLE IF NOT EXISTS page_blocks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  page_key VARCHAR(120) NOT NULL,
  block_type VARCHAR(80) NOT NULL,
  title VARCHAR(190) NOT NULL,
  subtitle VARCHAR(500) NULL,
  payload JSON NULL,
  style JSON NULL,
  visibility JSON NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY page_blocks_page_key_index (page_key),
  KEY page_blocks_status_index (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS theme_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(120) NOT NULL,
  `value` VARCHAR(500) NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'string',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY theme_settings_key_unique (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(190) NOT NULL,
  message VARCHAR(500) NOT NULL,
  icon VARCHAR(80) NULL,
  status ENUM('unread', 'read', 'archived') NOT NULL DEFAULT 'unread',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY notifications_status_index (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS analytics_daily (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  date DATE NOT NULL,
  path VARCHAR(190) NOT NULL,
  views INT UNSIGNED NOT NULL DEFAULT 0,
  unique_visitors INT UNSIGNED NOT NULL DEFAULT 0,
  conversions INT UNSIGNED NOT NULL DEFAULT 0,
  errors INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY analytics_daily_date_path_unique (date, path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS backup_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  file_name VARCHAR(255) NOT NULL,
  includes JSON NULL,
  status ENUM('queued', 'running', 'completed', 'failed') NOT NULL DEFAULT 'queued',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY backup_jobs_status_index (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_keys (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider VARCHAR(120) NOT NULL,
  label VARCHAR(190) NOT NULL,
  masked_value VARCHAR(190) NOT NULL,
  encrypted_value TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY api_keys_provider_index (provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO page_blocks (page_key, block_type, title, subtitle, status, sort_order)
VALUES
  ('home', 'hero', 'Modern web tasarım ve yazılım çözümleri', 'Kurumsal web siteleri ve özel yazılım için Spilweb.', 'published', 1),
  ('home', 'services', 'Hizmetler', 'Web tasarım şirketi için gereken ana hizmetler.', 'published', 2),
  ('home', 'portfolio', 'Seçili projeler', 'Filtrelenebilir portföy vitrinleri.', 'published', 3)
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO theme_settings (`key`, `value`, type)
VALUES
  ('primary_color', '#164c45', 'color'),
  ('accent_color', '#d7a545', 'color'),
  ('radius', '8px', 'string'),
  ('font_family', 'Inter, system-ui, sans-serif', 'string'),
  ('navbar_height', '76px', 'string')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), type = VALUES(type);

INSERT INTO notifications (title, message, icon, status)
VALUES
  ('Yeni teklif modülü hazır', 'Bildirim merkezi veri modeli eklendi.', 'bi bi-send-check', 'unread'),
  ('Yedekleme altyapısı', 'Yedekleme kayıtları artık panelden izlenebilir.', 'bi bi-archive', 'unread')
ON DUPLICATE KEY UPDATE message = VALUES(message);

INSERT INTO analytics_daily (date, path, views, unique_visitors, conversions, errors)
VALUES
  (CURRENT_DATE, '/tr', 148, 82, 6, 0),
  (CURRENT_DATE, '/tr/services', 76, 41, 3, 0),
  (CURRENT_DATE, '/tr/quote', 34, 22, 8, 0),
  (CURRENT_DATE, '/tr/blog', 29, 18, 1, 1)
ON DUPLICATE KEY UPDATE
  views = VALUES(views),
  unique_visitors = VALUES(unique_visitors),
  conversions = VALUES(conversions),
  errors = VALUES(errors);

INSERT INTO api_keys (provider, label, masked_value)
VALUES
  ('Google Maps', 'Maps Browser Key', 'AIza************'),
  ('reCAPTCHA', 'Site Key', '6Lc************'),
  ('SMTP', 'Default SMTP', 'smtp************')
ON DUPLICATE KEY UPDATE masked_value = VALUES(masked_value);


-- ===== 005_sprint_5_customer_portal =====
CREATE TABLE IF NOT EXISTS customers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  company_name VARCHAR(190) NOT NULL,
  tax_number VARCHAR(80) NULL,
  contact_name VARCHAR(190) NULL,
  phone VARCHAR(40) NULL,
  email VARCHAR(190) NULL,
  address VARCHAR(500) NULL,
  status ENUM('lead', 'active', 'passive', 'archived') NOT NULL DEFAULT 'lead',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY customers_user_id_index (user_id),
  KEY customers_status_index (status),
  CONSTRAINT customers_user_id_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

UPDATE customers AS legacy_customer
LEFT JOIN customers AS target_customer
  ON target_customer.email = CONCAT(
    SUBSTRING_INDEX(legacy_customer.email, '@', 1),
    '@spilweb.net.tr'
  )
SET legacy_customer.email = CONCAT(
  SUBSTRING_INDEX(legacy_customer.email, '@', 1),
  '@spilweb.net.tr'
)
WHERE legacy_customer.email LIKE '%@spilweb.%'
  AND legacy_customer.email NOT LIKE '%@spilweb.net.tr'
  AND target_customer.id IS NULL;

CREATE TABLE IF NOT EXISTS projects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(190) NOT NULL,
  description VARCHAR(500) NULL,
  status ENUM('waiting', 'planning', 'development', 'testing', 'revision', 'completed', 'archived') NOT NULL DEFAULT 'waiting',
  priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  progress TINYINT UNSIGNED NOT NULL DEFAULT 0,
  start_date DATE NULL,
  due_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY projects_customer_id_index (customer_id),
  KEY projects_status_index (status),
  CONSTRAINT projects_customer_id_fk FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_tasks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(190) NOT NULL,
  description TEXT NULL,
  status ENUM('todo', 'doing', 'testing', 'done') NOT NULL DEFAULT 'todo',
  priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  due_date DATE NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY project_tasks_project_id_index (project_id),
  KEY project_tasks_status_index (status),
  CONSTRAINT project_tasks_project_id_fk FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_quotes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(190) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'TRY',
  status ENUM('draft', 'sent', 'approved', 'rejected', 'expired') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY crm_quotes_customer_id_index (customer_id),
  CONSTRAINT crm_quotes_customer_id_fk FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  invoice_number VARCHAR(80) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'TRY',
  due_date DATE NULL,
  status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY invoices_invoice_number_unique (invoice_number),
  KEY invoices_customer_id_index (customer_id),
  CONSTRAINT invoices_customer_id_fk FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  subject VARCHAR(190) NOT NULL,
  category VARCHAR(80) NOT NULL,
  status ENUM('new', 'waiting', 'answered', 'closed') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY support_tickets_customer_id_index (customer_id),
  KEY support_tickets_status_index (status),
  CONSTRAINT support_tickets_customer_id_fk FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_id BIGINT UNSIGNED NOT NULL,
  sender_type ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY support_messages_ticket_id_index (ticket_id),
  CONSTRAINT support_messages_ticket_id_fk FOREIGN KEY (ticket_id) REFERENCES support_tickets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_files (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  size_label VARCHAR(40) NOT NULL DEFAULT '0 KB',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY project_files_project_id_index (project_id),
  CONSTRAINT project_files_project_id_fk FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS calendar_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NULL,
  title VARCHAR(190) NOT NULL,
  description VARCHAR(500) NULL,
  event_type VARCHAR(80) NOT NULL DEFAULT 'milestone',
  event_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY calendar_events_customer_id_index (customer_id),
  CONSTRAINT calendar_events_customer_id_fk FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
  CONSTRAINT calendar_events_project_id_fk FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(190) NOT NULL,
  message VARCHAR(500) NOT NULL,
  status ENUM('unread', 'read') NOT NULL DEFAULT 'unread',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY customer_notifications_customer_id_index (customer_id),
  CONSTRAINT customer_notifications_customer_id_fk FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO customers (id, company_name, contact_name, email, status)
VALUES (1, 'Spilweb Demo Müşteri', 'Demo Kullanıcı', 'demo@spilweb.net.tr', 'active')
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), status = VALUES(status);

INSERT INTO projects (id, customer_id, name, description, status, priority, progress, start_date, due_date)
VALUES
  (1, 1, 'Kurumsal Web Sitesi', 'Spilweb tanıtım sitesi ve CMS altyapısı.', 'development', 'high', 68, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 21 DAY)),
  (2, 1, 'SEO ve Performans Paketi', 'Teknik SEO, hız ve ölçümleme iyileştirmeleri.', 'planning', 'normal', 25, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 35 DAY))
ON DUPLICATE KEY UPDATE progress = VALUES(progress), status = VALUES(status);

INSERT INTO project_tasks (project_id, title, status, priority, due_date, sort_order)
VALUES
  (1, 'Ana sayfa revizyonu', 'doing', 'high', DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY), 1),
  (1, 'İletişim formu testi', 'testing', 'normal', DATE_ADD(CURRENT_DATE, INTERVAL 8 DAY), 2),
  (1, 'Yayın hazırlık kontrolü', 'todo', 'normal', DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), 3),
  (2, 'Meta etiket analizi', 'done', 'normal', DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), 4);

INSERT INTO crm_quotes (customer_id, title, amount, currency, status)
VALUES
  (1, 'Kurumsal Web Sitesi Teklifi', 45000.00, 'TRY', 'sent'),
  (1, 'SEO Bakım Paketi', 12000.00, 'TRY', 'draft');

INSERT INTO invoices (customer_id, invoice_number, amount, currency, due_date, status)
VALUES
  (1, 'SPW-2026-001', 15000.00, 'TRY', DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY), 'sent')
ON DUPLICATE KEY UPDATE amount = VALUES(amount), status = VALUES(status);

INSERT INTO support_tickets (customer_id, subject, category, status)
VALUES
  (1, 'Logo gorseli guncelleme', 'design', 'answered'),
  (1, 'Hosting DNS kontrolu', 'hosting', 'waiting');

INSERT INTO project_files (project_id, file_name, file_path, size_label)
VALUES
  (1, 'brand-assets.zip', '/uploads/demo/brand-assets.zip', '18 MB'),
  (1, 'homepage-wireframe.pdf', '/uploads/demo/homepage-wireframe.pdf', '2.4 MB');

INSERT INTO calendar_events (customer_id, project_id, title, description, event_type, event_date)
VALUES
  (1, 1, 'Revizyon toplantisi', 'Ana sayfa ve hizmetler sayfasi geri bildirimleri.', 'meeting', DATE_ADD(CURRENT_DATE, INTERVAL 4 DAY)),
  (1, 1, 'Test teslimi', 'Frontend test ortami teslimi.', 'milestone', DATE_ADD(CURRENT_DATE, INTERVAL 12 DAY));

INSERT INTO customer_notifications (customer_id, title, message)
VALUES
  (1, 'Teklifiniz hazir', 'Kurumsal web sitesi teklifiniz portalda goruntulenebilir.'),
  (1, 'Yeni dosya yuklendi', 'Homepage wireframe dosyasi proje dosyalarina eklendi.');


-- ===== 006_security_roles_default_admin =====
INSERT INTO users (first_name, last_name, email, password_hash, language, status, email_verified_at)
VALUES (
  'Spilweb',
  'Admin',
  'admin@spilweb.net.tr',
  '$2b$12$kuaTEj4fX.gMVKKom7oBeOq5ZqEMCvUQSCRhKLM..dDIBO8.iIqOm',
  'tr',
  'active',
  CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE
  status = 'active',
  email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
INNER JOIN roles r ON r.name = 'super_admin'
WHERE u.email = 'admin@spilweb.net.tr'
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);


-- ===== 007_demo_access_service_plans =====
ALTER TABLE users
  MODIFY status ENUM('active', 'pending', 'suspended') NOT NULL DEFAULT 'active';

UPDATE users
SET status = 'active'
WHERE status = 'pending'
  AND id IN (
    SELECT user_id FROM user_roles
    WHERE role_id = (SELECT id FROM roles WHERE name = 'customer' LIMIT 1)
  );

CREATE TABLE IF NOT EXISTS service_plans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(80) NOT NULL,
  title_tr VARCHAR(190) NOT NULL,
  title_en VARCHAR(190) NOT NULL,
  description_tr VARCHAR(500) NULL,
  description_en VARCHAR(500) NULL,
  original_price DECIMAL(12,2) NULL,
  price DECIMAL(12,2) NOT NULL,
  discount_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'TRY',
  billing_type ENUM('one_time', 'monthly') NOT NULL DEFAULT 'one_time',
  features_tr JSON NULL,
  features_en JSON NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY service_plans_slug_unique (slug),
  KEY service_plans_status_index (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE service_plans
  ADD COLUMN IF NOT EXISTS original_price DECIMAL(12,2) NULL AFTER description_en;

ALTER TABLE service_plans
  ADD COLUMN IF NOT EXISTS discount_percent TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER price;

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NULL,
  status ENUM('demo', 'pending', 'active', 'expired', 'cancelled') NOT NULL DEFAULT 'demo',
  requested_at TIMESTAMP NULL,
  activated_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY user_subscriptions_user_unique (user_id),
  KEY user_subscriptions_plan_index (plan_id),
  KEY user_subscriptions_status_index (status),
  CONSTRAINT user_subscriptions_user_id_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT user_subscriptions_plan_id_fk FOREIGN KEY (plan_id) REFERENCES service_plans (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO service_plans (
  slug, title_tr, title_en, description_tr, description_en,
  original_price, price, discount_percent, currency, billing_type, features_tr, features_en, sort_order
)
VALUES
  (
    'corporate-web', 'Kurumsal Web', 'Corporate Web',
    'Markanızı güvenle anlatan, hızlı ve çok dilli kurumsal web sitesi.',
    'A multilingual, SEO-focused corporate website.',
    35000, 28000, 20, 'TRY', 'one_time',
    '["Özel arayüz ve responsive tasarım", "TR / EN çoklu dil altyapısı", "Teknik SEO ve performans kurulumu"]',
    '["Custom responsive interface", "TR / EN language foundation", "Technical SEO setup"]',
    1
  ),
  (
    'e-commerce', 'E-Ticaret', 'E-Commerce',
    'Ürünlerinizi kolay yönetebileceğiniz, dönüşüm odaklı satış deneyimi.',
    'An e-commerce platform ready for products, orders, and payments.',
    65000, 52000, 20, 'TRY', 'one_time',
    '["Ürün, kategori ve stok yönetimi", "Sepet ve ödeme entegrasyonu", "Sipariş ve müşteri paneli"]',
    '["Product and stock management", "Cart and payment integration", "Order portal"]',
    2
  ),
  (
    'custom-software', 'Özel Yazılım', 'Custom Software',
    'İş akışlarınıza göre tasarlanan güvenli panel, CRM ve otomasyon çözümleri.',
    'Custom panels, CRM, and automation for your business workflows.',
    95000, 76000, 20, 'TRY', 'one_time',
    '["İhtiyaca özel panel ve roller", "API ve üçüncü taraf entegrasyonları", "Ölçeklenebilir backend mimarisi"]',
    '["Custom panels and roles", "API integrations", "Scalable backend"]',
    3
  )
ON DUPLICATE KEY UPDATE
  title_tr = VALUES(title_tr),
  title_en = VALUES(title_en),
  description_tr = VALUES(description_tr),
  description_en = VALUES(description_en),
  original_price = VALUES(original_price),
  price = VALUES(price),
  discount_percent = VALUES(discount_percent),
  currency = VALUES(currency),
  billing_type = VALUES(billing_type),
  features_tr = VALUES(features_tr),
  features_en = VALUES(features_en),
  status = 'active',
  sort_order = VALUES(sort_order);

INSERT INTO user_subscriptions (user_id, status)
SELECT DISTINCT u.id, 'demo'
FROM users u
INNER JOIN user_roles ur ON ur.user_id = u.id
INNER JOIN roles r ON r.id = ur.role_id AND r.name = 'customer'
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;


-- ===== 008_turkish_service_plan_copy =====
UPDATE service_plans
SET
  title_tr = 'Kurumsal Web',
  description_tr = 'Markanızı güvenle anlatan, hızlı ve çok dilli kurumsal web sitesi.',
  features_tr = '["Özel arayüz ve responsive tasarım", "TR / EN çoklu dil altyapısı", "Teknik SEO ve performans kurulumu"]'
WHERE slug = 'corporate-web';

UPDATE service_plans
SET
  title_tr = 'E-Ticaret',
  description_tr = 'Ürünlerinizi kolay yönetebileceğiniz, dönüşüm odaklı satış deneyimi.',
  features_tr = '["Ürün, kategori ve stok yönetimi", "Sepet ve ödeme entegrasyonu", "Sipariş ve müşteri paneli"]'
WHERE slug = 'e-commerce';

UPDATE service_plans
SET
  title_tr = 'Özel Yazılım',
  description_tr = 'İş akışlarınıza göre tasarlanan güvenli panel, CRM ve otomasyon çözümleri.',
  features_tr = '["İhtiyaca özel panel ve roller", "API ve üçüncü taraf entegrasyonları", "Ölçeklenebilir backend mimarisi"]'
WHERE slug = 'custom-software';


-- ===== 009_launch_discount =====
ALTER TABLE service_plans
  ADD COLUMN IF NOT EXISTS original_price DECIMAL(12,2) NULL AFTER description_en;

ALTER TABLE service_plans
  ADD COLUMN IF NOT EXISTS discount_percent TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER price;

UPDATE service_plans
SET original_price = 35000, price = 28000, discount_percent = 20
WHERE slug = 'corporate-web';

UPDATE service_plans
SET original_price = 65000, price = 52000, discount_percent = 20
WHERE slug = 'e-commerce';

UPDATE service_plans
SET original_price = 95000, price = 76000, discount_percent = 20
WHERE slug = 'custom-software';


-- ===== 010_turkish_character_fixes =====
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

UPDATE content_items
SET title = 'Hakkımızda', excerpt = 'Spilweb marka ve ajans tanıtımı.'
WHERE slug = 'hakkimizda';

UPDATE content_items
SET title = 'Kurumsal Web Tasarım'
WHERE slug = 'kurumsal-web-tasarim';

UPDATE content_items
SET excerpt = 'Çok dilli kurumsal web vitrini.'
WHERE slug = 'atlas-kurumsal';

UPDATE content_items
SET excerpt = 'Meta, canonical ve performans notları.'
WHERE slug = 'teknik-seo-temeli';

UPDATE page_blocks
SET title = 'Modern web tasarım ve yazılım çözümleri',
    subtitle = 'Kurumsal web siteleri ve özel yazılım için Spilweb.'
WHERE page_key = 'home' AND block_type = 'hero';

UPDATE page_blocks
SET subtitle = 'Web tasarım şirketi için gereken ana hizmetler.'
WHERE page_key = 'home' AND block_type = 'services';

UPDATE page_blocks
SET title = 'Seçili projeler', subtitle = 'Filtrelenebilir portföy vitrinleri.'
WHERE page_key = 'home' AND block_type = 'portfolio';

UPDATE customers
SET company_name = 'Spilweb Demo Müşteri', contact_name = 'Demo Kullanıcı'
WHERE email = 'demo@spilweb.net.tr';

UPDATE project_tasks
SET title = 'İletişim formu testi'
WHERE title = 'Iletisim formu testi';

UPDATE projects
SET description = 'Spilweb tanıtım sitesi ve CMS altyapısı.'
WHERE id = 1;

UPDATE projects
SET description = 'Teknik SEO, hız ve ölçümleme iyileştirmeleri.'
WHERE id = 2;

UPDATE project_tasks
SET title = 'Yayın hazırlık kontrolü'
WHERE title = 'Yayin hazirlik checklist';

UPDATE crm_quotes
SET title = 'SEO Bakım Paketi'
WHERE title = 'SEO Bakim Paketi';

UPDATE notifications
SET title = 'Yeni teklif modülü hazır', message = 'Bildirim merkezi veri modeli eklendi.'
WHERE title = 'Yeni teklif modulu hazir';

UPDATE notifications
SET title = 'Yedekleme altyapısı', message = 'Yedekleme kayıtları artık panelden izlenebilir.'
WHERE title = 'Yedekleme altyapisi';


-- ===== 012_spilweb_net_tr_domain =====
INSERT INTO settings (`key`, `value`, `type`)
VALUES ('site_url', 'https://www.spilweb.net.tr', 'string')
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`),
  `type` = VALUES(`type`),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO settings (`key`, `value`, `type`)
VALUES ('contact_email', 'info@spilweb.net.tr', 'string')
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`),
  `type` = VALUES(`type`),
  updated_at = CURRENT_TIMESTAMP;


SET FOREIGN_KEY_CHECKS = 1;
