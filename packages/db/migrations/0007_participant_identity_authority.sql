-- A source participant reference is lineage, not authority to link an arbitrary Person.
-- DCRM-04B canonical Identity already carries PERSON/MATCHED_SAFE/exact-target proof;
-- the existing composite FK requires that Identity and Person agree within the tenant.
ALTER TABLE activity_participants
  ADD CONSTRAINT activity_participants_source_person_authority_ck CHECK (
    source_participant_ref IS NULL OR person_id IS NULL OR identity_id IS NOT NULL
  );
