-- Bubblecast only: SRS-lite due dates on vocab
alter table bubblecast.vocab
  add column if not exists next_review_at timestamptz;

comment on column bubblecast.vocab.next_review_at is 'When this card is due for practice (SRS-lite)';

insert into bubblecast.schema_migrations (id)
values ('20260722_000005_vocab_next_review_at')
on conflict (id) do nothing;

notify pgrst, 'reload schema';
