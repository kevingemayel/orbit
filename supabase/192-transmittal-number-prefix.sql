-- 192: keep transmittal numbers running on TR/.
--
-- Document Numbering keys a transmittal's row by its code, TRN, but transmittals have always
-- been numbered TR/. The old screen showed the code as the default prefix, so a company that
-- pressed Save stored prefix TRN without choosing it, and numbers were never read from that row.
-- The app now reads it, which would restart those companies at TRN/year/0001. A stored prefix
-- equal to the code is that old default: set it back to what their transmittals already carry.
-- A prefix anyone actually typed is left alone. Safe to re-run.

update public.number_sequences
   set prefix = 'TR'
 where doc_type = 'TRN'
   and prefix = 'TRN';
