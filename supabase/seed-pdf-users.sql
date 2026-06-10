DO $$
DECLARE
  new_user_ids TEXT[] := ARRAY[
    'user_2a0076', 'user_2a0077', 'user_2a0078', 'user_2a0079', 'user_2a0080',
    'user_2a0081', 'user_2a0082', 'user_2a0083', 'user_2a0084', 'user_2a0085',
    'user_2a0086', 'user_2a0087', 'user_2a0088', 'user_2a0089', 'user_2a0090',
    'user_2a0091', 'user_2a0092', 'user_2a0093', 'user_2a0094', 'user_2a0095',
    'user_2a0096', 'user_2a0097', 'user_2a0098', 'user_2a0099', 'user_2a0100',
    'user_2a0101', 'user_2a0102', 'user_2a0103', 'user_2a0104', 'user_2a0105'
  ];

  new_first_names TEXT[] := ARRAY[
    'Arlo', 'Bianca', 'Cedric', 'Daphne', 'Ellis',
    'Fern', 'Gideon', 'Hazel', 'Idris', 'Juno',
    'Kian', 'Lara', 'Maren', 'Nico', 'Opal',
    'Phineas', 'Quill', 'Rosalind', 'Silas', 'Talia',
    'Ulysses', 'Valencia', 'Wilder', 'Xenia', 'Yorick',
    'Zara', 'Aurora', 'Beckett', 'Celeste', 'Dorian'
  ];

  new_last_names TEXT[] := ARRAY[
    'Frost', 'Glover', 'Holt', 'Irwin', 'Kane',
    'Lutz', 'Marsh', 'Nash', 'Owen', 'Potts',
    'Quinn', 'Roth', 'Sloan', 'Tate', 'Underwood',
    'Vance', 'Wade', 'York', 'Zimmerman', 'Abbott',
    'Boyd', 'Cross', 'Dalton', 'Eaton', 'Flynn',
    'Gibbs', 'Hughes', 'Irving', 'Jensen', 'Knox'
  ];

  -- Hardcoded from seed-files/seed-files.sql (deterministic UUIDs derived from names, stable across re-uploads)
  pdf_template_ids UUID[] := ARRAY[
    '469198a6-43cd-4137-884c-e741acb2a4fd'::uuid,
    'f237d764-c46a-4686-89c5-19e68a3bb002'::uuid,
    '8466ac10-dc70-455c-8956-2444b9f7dd73'::uuid
  ];

  pdf_template_variant_ids UUID[] := ARRAY[
    '147ae260-cf2e-4475-8b48-a067a9a2dbea'::uuid,
    'cb7e576f-8eeb-4f53-8f6c-079a0de15b4d'::uuid,
    '3b154a61-f8a7-4744-8a3c-59ebfb7732a6'::uuid,
    'da25f976-8d2a-41f8-837a-f3fb9dd78787'::uuid,
    '63fe1f26-b71a-4b79-8c45-04464459c143'::uuid,
    '935ad3f9-f284-459d-82f5-f4bef68ea7e8'::uuid
  ];

  i INTEGER;
  j INTEGER;
  admin_id TEXT := 'user_2a0001';
  club_ids UUID[] := '{}';
  existing_approved_cert_ids UUID[] := '{}';
  new_cert_ids UUID[] := '{}';
  all_user_ids TEXT[] := '{}';
  temp_cert_id UUID;
  club_idx INTEGER;
  variant_idx INTEGER;
  template_idx INTEGER;

  reviewer_idx INTEGER;
  upvoter_idx INTEGER;
  num_feedback INTEGER;
  num_upvotes INTEGER;
  feedback_idx INTEGER;
  admin_fb_idx INTEGER;
  claim_admin_fb_idx INTEGER;
  used_reviewers INTEGER[];
  has_linkedin BOOLEAN;

  english_levels TEXT[] := ARRAY['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  feedback_texts TEXT[] := ARRAY[
    'Amazing presentation! Really well structured and clear.',
    'Great work on this certificate. The content is very engaging.',
    'I enjoyed reviewing this. Very thorough and well-researched.',
    'Excellent job! The speaking skills demonstrated are top-notch.',
    'Really impressive work. Keep it up!',
    'This is a solid certificate. Great effort put into it.',
    'Well done! The English level shown is very good.',
    'Outstanding certificate. One of the best I have seen.',
    'Very professional presentation. Great attention to detail.',
    'Inspiring work! This shows real dedication to learning.',
    'Impressive vocabulary and sentence structure throughout.',
    'A pleasure to review. Clearly a lot of effort went into this.',
    'Great improvement shown compared to earlier submissions.',
    'Thorough and comprehensive. Really well put together.',
    'Fantastic work! The speaking clarity has improved remarkably.'
  ];

  admin_feedback_texts TEXT[] := ARRAY[
    'Excellent progress! The club participation is noteworthy.',
    'Very well done. This student has shown consistent improvement.',
    'A commendable effort. The speaking skills have improved significantly.',
    'Great dedication to learning English. Keep up the good work!',
    'Impressive commitment to the program. Well deserved certificate.',
    'Outstanding achievement! This sets a great example for peers.',
    'Consistent participation and clear progress in speaking skills.',
    'A model student. Always engaged and eager to improve.'
  ];

  claim_admin_feedback TEXT[] := ARRAY[
    'Strong performance across all criteria. Certificate approved.',
    'Meets all requirements. Great speaking ability demonstrated.',
    'Good progress. English level meets the threshold for certification.',
    'Excellent work. All requirements fulfilled with high quality.',
    'Solid performance. Approved with distinction.',
    'Satisfies all certification criteria. Well done.',
    'Above average performance. Clearly dedicated to the program.',
    'Approved. Strong communication skills demonstrated.'
  ];

  -- Masterclass name+description sets for Template 1 (Dark Navy Gold)
  masterclass_names TEXT[] := ARRAY[
    'Advanced Public Speaking',
    'Business Communication Mastery',
    'Leadership Presentation Skills'
  ];
  masterclass_descriptions TEXT[] := ARRAY[
    'An intensive masterclass covering advanced techniques in public speaking, audience engagement, and speech structure.',
    'Focused on effective business communication including meetings, presentations, and written correspondence.',
    'Explores leadership communication styles, team motivation, and executive presence with practical exercises.'
  ];

  -- Facilitator+coordinator sets for Template 3 (Professional Leadership)
  facilitator_names TEXT[] := ARRAY[
    'Dr. Sarah Mitchell',
    'Prof. James Harrington',
    'Ms. Elena Rodriguez'
  ];
  coordinator_names TEXT[] := ARRAY[
    'Linda Thompson',
    'Marcus Webb',
    'Natalie Petrova'
  ];
BEGIN
  ---------------------------------------------------------------------------
  -- 0. Gather existing data
  ---------------------------------------------------------------------------
  SELECT array_agg(id ORDER BY created_at) INTO club_ids FROM speaking_clubs;
  SELECT array_agg(id ORDER BY created_at) INTO existing_approved_cert_ids FROM certificate_claims WHERE status = 'approved';
  SELECT array_agg(id ORDER BY id) INTO all_user_ids FROM profiles;

  ---------------------------------------------------------------------------
  -- 1. PROFILES (30 new users 76–105)
  ---------------------------------------------------------------------------
  FOR i IN 1..30 LOOP
    INSERT INTO profiles (id, email, first_name, last_name, username, avatar_url, linkedin_url, is_admin, created_at, updated_at)
    VALUES (
      new_user_ids[i],
      LOWER(new_first_names[i]) || '.' || LOWER(new_last_names[i]) || '@example.com',
      new_first_names[i],
      new_last_names[i],
      LOWER(new_first_names[i]) || '_' || LOWER(new_last_names[i]),
      'https://api.dicebear.com/9.x/avataaars/png?seed=' || new_user_ids[i],
      CASE WHEN random() < 0.35
        THEN 'https://linkedin.com/in/' || LOWER(new_first_names[i]) || '-' || LOWER(new_last_names[i])
        ELSE NULL
      END,
      FALSE,
      NOW() - (random() * INTERVAL '30 days'),
      NOW() - (random() * INTERVAL '15 days')
    );
  END LOOP;

  -- Extend all_user_ids with new users
  all_user_ids := all_user_ids || new_user_ids;

  ---------------------------------------------------------------------------
  -- 2. CLUB MEMBERSHIPS (6 new members per existing club)
  --    Club 1 (SpeakEasy):        users 76–81   (new indices 1–6)
  --    Club 2 (Fluent Speakers):  users 82–87   (new indices 7–12)
  --    Club 3 (English Hub):      users 88–93   (new indices 13–18)
  --    Club 4 (Confidence Talks): users 94–99   (new indices 19–24)
  --    Club 5 (Global Orators):   users 100–105 (new indices 25–30)
  ---------------------------------------------------------------------------
  FOR i IN 1..30 LOOP
    club_idx := ((i - 1) / 6)::INTEGER + 1;
    INSERT INTO club_memberships (club_id, user_id, role, created_at)
    VALUES (club_ids[club_idx], new_user_ids[i], 'member', NOW() - (random() * INTERVAL '20 days'));
  END LOOP;

  ---------------------------------------------------------------------------
  -- 3. CERTIFICATE CLAIMS (30 approved with PDF templates)
  --    10 per template, 5 per variant.
  --    Variants cycle (5 users each):
  --      1–5:   Dark Navy Gold (Landscape)
  --      6–10:  Dark Navy Gold (Portrait)
  --      11–15: Elegant Gold (Landscape)
  --      16–20: Elegant Gold (Portrait)
  --      21–25: Professional Leadership (Landscape)
  --      26–30: Professional Leadership (Portrait)
  ---------------------------------------------------------------------------
  FOR i IN 1..30 LOOP
    club_idx := ((i - 1) / 6)::INTEGER + 1;
    variant_idx := ((i - 1) / 5)::INTEGER + 1;
    template_idx := ((variant_idx - 1) / 2)::INTEGER + 1;

    claim_admin_fb_idx := 1 + floor(random() * array_length(claim_admin_feedback, 1))::INTEGER;

    INSERT INTO certificate_claims (
      user_id, club_id, status, slug, admin_feedback,
      english_level, speaking_clubs_count, hours_participated,
      background_template,
      pdf_template_id, pdf_template_variant_id,
      created_at, updated_at
    )
    VALUES (
      new_user_ids[i],
      club_ids[club_idx],
      'approved',
      generate_certificate_slug(),
      claim_admin_feedback[claim_admin_fb_idx],
      english_levels[1 + floor(random() * 6)::INTEGER],
      3 + floor(random() * 18)::INTEGER,
      20 + floor(random() * 180)::INTEGER,
      NULL,
      pdf_template_ids[template_idx],
      pdf_template_variant_ids[variant_idx],
      NOW() - ((20 + floor(random() * 20))::INTEGER * INTERVAL '1 day'),
      NOW() - (floor(random() * 10)::INTEGER * INTERVAL '1 day')
    )
    RETURNING id INTO temp_cert_id;
    new_cert_ids := array_append(new_cert_ids, temp_cert_id);
  END LOOP;

  ---------------------------------------------------------------------------
  -- 9. CUSTOM FIELD VALUES for PDF template certificates
  --    Claims 1–10 use Template 1 (Dark Navy Gold) → masterclass name + description
  --    Claims 21–30 use Template 3 (Professional Leadership) → facilitator + coordinator
  --    3 value sets cycle via modulo to keep paired fields consistent
  ---------------------------------------------------------------------------
  FOR i IN 1..10 LOOP
    INSERT INTO pdf_custom_values (claim_id, field_id, value)
    VALUES
      (new_cert_ids[i], '9047917d-3d75-4903-8041-b39e0ffe8a07', masterclass_names[((i - 1) % 3) + 1]),
      (new_cert_ids[i], '03108622-662f-4e87-8bbb-953bb5080234', masterclass_descriptions[((i - 1) % 3) + 1]);
  END LOOP;

  FOR i IN 21..30 LOOP
    INSERT INTO pdf_custom_values (claim_id, field_id, value)
    VALUES
      (new_cert_ids[i], '51327c29-b603-43f8-8cb8-6eb372b5a952', facilitator_names[((i - 21) % 3) + 1]),
      (new_cert_ids[i], '012ad24b-9e97-43cb-8007-d64dfa6e84f4', coordinator_names[((i - 21) % 3) + 1]);
  END LOOP;

  ---------------------------------------------------------------------------
  -- 4. PEER FEEDBACK on new certificates
  --    Each gets 5–15 reviews from all 105 users (excluding self)
  ---------------------------------------------------------------------------
  FOR i IN 1..array_length(new_cert_ids, 1) LOOP
    num_feedback := 5 + floor(random() * 11)::INTEGER;
    used_reviewers := '{}';

    FOR j IN 1..num_feedback LOOP
      reviewer_idx := 1 + floor(random() * 105)::INTEGER;
      WHILE reviewer_idx = (75 + i) OR array_position(used_reviewers, reviewer_idx) IS NOT NULL LOOP
        reviewer_idx := 1 + floor(random() * 105)::INTEGER;
      END LOOP;
      used_reviewers := array_append(used_reviewers, reviewer_idx);

      feedback_idx := 1 + floor(random() * array_length(feedback_texts, 1))::INTEGER;
      has_linkedin := random() < 0.3;

      INSERT INTO certificate_feedback (certificate_id, reviewer_id, feedback_text, display_name_preference, linkedin_url, status, sort_order, is_visible, created_at, updated_at)
      VALUES (
        new_cert_ids[i],
        all_user_ids[reviewer_idx],
        feedback_texts[feedback_idx],
        CASE WHEN random() < 0.35 THEN 'full_name' ELSE 'nickname' END,
        CASE
          WHEN has_linkedin AND reviewer_idx > 75
            THEN 'https://linkedin.com/in/' || LOWER(new_first_names[reviewer_idx - 75]) || '-' || LOWER(new_last_names[reviewer_idx - 75])
          ELSE NULL
        END,
        'approved',
        j - 1,
        TRUE,
        NOW() - ((10 + floor(random() * 15))::INTEGER * INTERVAL '1 day'),
        NOW() - (floor(random() * 5)::INTEGER * INTERVAL '1 day')
      );
    END LOOP;
  END LOOP;

  ---------------------------------------------------------------------------
  -- 5. PEER FEEDBACK on existing certificates from new users
  --    Each existing approved cert gets 2–4 fresh reviews from the new cohort
  ---------------------------------------------------------------------------
  FOR i IN 1..array_length(existing_approved_cert_ids, 1) LOOP
    num_feedback := 2 + floor(random() * 3)::INTEGER;
    used_reviewers := '{}';

    FOR j IN 1..num_feedback LOOP
      reviewer_idx := 1 + floor(random() * 30)::INTEGER;
      WHILE array_position(used_reviewers, reviewer_idx) IS NOT NULL LOOP
        reviewer_idx := 1 + floor(random() * 30)::INTEGER;
      END LOOP;
      used_reviewers := array_append(used_reviewers, reviewer_idx);

      feedback_idx := 1 + floor(random() * array_length(feedback_texts, 1))::INTEGER;
      has_linkedin := random() < 0.3;

      INSERT INTO certificate_feedback (certificate_id, reviewer_id, feedback_text, display_name_preference, linkedin_url, status, sort_order, is_visible, created_at, updated_at)
      VALUES (
        existing_approved_cert_ids[i],
        new_user_ids[reviewer_idx],
        feedback_texts[feedback_idx],
        CASE WHEN random() < 0.35 THEN 'full_name' ELSE 'nickname' END,
        CASE WHEN has_linkedin
          THEN 'https://linkedin.com/in/' || LOWER(new_first_names[reviewer_idx]) || '-' || LOWER(new_last_names[reviewer_idx])
          ELSE NULL
        END,
        'approved',
        j - 1,
        TRUE,
        NOW() - ((10 + floor(random() * 15))::INTEGER * INTERVAL '1 day'),
        NOW() - (floor(random() * 5)::INTEGER * INTERVAL '1 day')
      );
    END LOOP;
  END LOOP;

  ---------------------------------------------------------------------------
  -- 6. ADMIN FEEDBACK on ~60% of new certificates
  ---------------------------------------------------------------------------
  FOR i IN 1..array_length(new_cert_ids, 1) LOOP
    IF random() < 0.6 THEN
      admin_fb_idx := 1 + floor(random() * array_length(admin_feedback_texts, 1))::INTEGER;
      INSERT INTO certificate_feedback (certificate_id, reviewer_id, feedback_text, display_name_preference, status, sort_order, is_visible, created_at, updated_at)
      VALUES (
        new_cert_ids[i],
        admin_id,
        admin_feedback_texts[admin_fb_idx],
        'full_name',
        'approved',
        99,
        TRUE,
        NOW() - ((8 + floor(random() * 12))::INTEGER * INTERVAL '1 day'),
        NOW() - (floor(random() * 5)::INTEGER * INTERVAL '1 day')
      );
    END IF;
  END LOOP;

  ---------------------------------------------------------------------------
  -- 7. UPVOTES on new certificates (from all 105 users, 10–30 per cert)
  ---------------------------------------------------------------------------
  FOR i IN 1..array_length(new_cert_ids, 1) LOOP
    num_upvotes := 10 + floor(random() * 21)::INTEGER;
    FOR j IN 1..num_upvotes LOOP
      upvoter_idx := 1 + floor(random() * 105)::INTEGER;
      WHILE upvoter_idx = (75 + i) LOOP
        upvoter_idx := 1 + floor(random() * 105)::INTEGER;
      END LOOP;
      BEGIN
        INSERT INTO certificate_upvotes (certificate_id, user_id, created_at)
        VALUES (
          new_cert_ids[i],
          all_user_ids[upvoter_idx],
          NOW() - ((5 + floor(random() * 20))::INTEGER * INTERVAL '1 day')
        );
      EXCEPTION WHEN SQLSTATE '23505' THEN
      END;
    END LOOP;
  END LOOP;

  ---------------------------------------------------------------------------
  -- 8. UPVOTES on existing certificates from new users (5–10 per cert)
  ---------------------------------------------------------------------------
  FOR i IN 1..array_length(existing_approved_cert_ids, 1) LOOP
    num_upvotes := 5 + floor(random() * 6)::INTEGER;
    FOR j IN 1..num_upvotes LOOP
      upvoter_idx := 1 + floor(random() * 30)::INTEGER;
      BEGIN
        INSERT INTO certificate_upvotes (certificate_id, user_id, created_at)
        VALUES (
          existing_approved_cert_ids[i],
          new_user_ids[upvoter_idx],
          NOW() - ((5 + floor(random() * 20))::INTEGER * INTERVAL '1 day')
        );
      EXCEPTION WHEN SQLSTATE '23505' THEN
      END;
    END LOOP;
  END LOOP;

END $$;
