-- Add email template columns to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS email_subject TEXT DEFAULT '【御礼】展示ブースにお立ち寄りいただきありがとうございます',
ADD COLUMN IF NOT EXISTS email_body TEXT DEFAULT 'この度は、当社のブースにお立ち寄りいただき、誠にありがとうございました。

ご案内いたしましたサービスについて、ご不明な点などがございましたら、
お気軽にお問い合わせください。

今後ともよろしくお願い申し上げます。';
