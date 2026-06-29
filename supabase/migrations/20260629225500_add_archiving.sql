-- 0009_add_archiving.sql

ALTER TABLE trade_opportunities ADD COLUMN is_archived boolean DEFAULT false;
