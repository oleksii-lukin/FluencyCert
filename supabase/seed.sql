DO $$
DECLARE
  user_ids TEXT[] := ARRAY[
    'user_2a0001', 'user_2a0002', 'user_2a0003', 'user_2a0004', 'user_2a0005',
    'user_2a0006', 'user_2a0007', 'user_2a0008', 'user_2a0009', 'user_2a0010',
    'user_2a0011', 'user_2a0012', 'user_2a0013', 'user_2a0014', 'user_2a0015',
    'user_2a0016', 'user_2a0017', 'user_2a0018', 'user_2a0019', 'user_2a0020',
    'user_2a0021', 'user_2a0022', 'user_2a0023', 'user_2a0024', 'user_2a0025',
    'user_2a0026', 'user_2a0027', 'user_2a0028', 'user_2a0029', 'user_2a0030',
    'user_2a0031', 'user_2a0032', 'user_2a0033', 'user_2a0034', 'user_2a0035',
    'user_2a0036', 'user_2a0037', 'user_2a0038', 'user_2a0039', 'user_2a0040',
    'user_2a0041', 'user_2a0042', 'user_2a0043', 'user_2a0044', 'user_2a0045',
    'user_2a0046', 'user_2a0047', 'user_2a0048', 'user_2a0049', 'user_2a0050',
    'user_2a0051', 'user_2a0052', 'user_2a0053', 'user_2a0054', 'user_2a0055',
    'user_2a0056', 'user_2a0057', 'user_2a0058', 'user_2a0059', 'user_2a0060',
    'user_2a0061', 'user_2a0062', 'user_2a0063', 'user_2a0064', 'user_2a0065',
    'user_2a0066', 'user_2a0067', 'user_2a0068', 'user_2a0069', 'user_2a0070',
    'user_2a0071', 'user_2a0072', 'user_2a0073', 'user_2a0074', 'user_2a0075'
  ];

  first_names TEXT[] := ARRAY[
    'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack',
    'Kate', 'Leo', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rose', 'Sam', 'Tina',
    'Uma', 'Victor', 'Wendy', 'Xander', 'Yara', 'Zack', 'Amelia', 'Benjamin', 'Chloe', 'Daniel',
    'Emma', 'Felix', 'Georgia', 'Hugo', 'Isla', 'James', 'Kira', 'Liam', 'Maya', 'Nathan',
    'Aria', 'Blake', 'Cora', 'Dylan', 'Elena', 'Finn', 'Greta', 'Hank', 'Iris', 'Jade',
    'Kai', 'Luna', 'Milo', 'Nora', 'Oscar', 'Piper', 'Rhea', 'Sage', 'Theo', 'Uri',
    'Vera', 'Wade', 'Xena', 'Yves', 'Zoe', 'Asher', 'Briar', 'Caspian', 'Dove', 'Elowen',
    'Fox', 'Greer', 'Harbor', 'Indigo', 'Journey'
  ];

  last_names TEXT[] := ARRAY[
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Moore', 'Clark',
    'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green',
    'Baker', 'Adams', 'Nelson', 'Carter', 'Mitchell', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker',
    'Edwards', 'Collins', 'Stewart', 'Morris', 'Murphy', 'Cook', 'Rogers', 'Morgan', 'Peterson', 'Cooper',
    'Reed', 'Bailey', 'Howard', 'Ward', 'Torres', 'Crawford', 'Mason', 'Reyes', 'Burns', 'Gordon',
    'Shaw', 'Holmes', 'Rice', 'Hunt', 'Palmer', 'Carpenter', 'Wells', 'Bryant', 'Hayes', 'Pierce',
    'Berry', 'Barnett', 'Welch', 'Hanson', 'Harmon'
  ];

  templates TEXT[] := ARRAY['guilloche-security', 'natural-green', 'cyber-neon', 'memphis-retro', 'neubrutal', 'modern-glass'];
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

  i INTEGER;
  j INTEGER;
  admin_id TEXT := 'user_2a0001';
  cert_ids UUID[] := '{}';
  temp_cert_id UUID;
  reviewer_idx INTEGER;
  upvoter_idx INTEGER;
  num_feedback INTEGER;
  num_upvotes INTEGER;
  feedback_idx INTEGER;
  admin_fb_idx INTEGER;
  claim_admin_fb_idx INTEGER;
  used_reviewers INTEGER[];
  has_linkedin BOOLEAN;

  -- Club variables
  club_ids UUID[] := '{}';
  temp_club_id UUID;
  club_member_count INTEGER;
  club_member_start INTEGER;
  club_admin_offset INTEGER;
  claim_member_idx INTEGER;
BEGIN

  ---------------------------------------------------------------------------
  -- 1. PROFILES (75 users)
  ---------------------------------------------------------------------------
  FOR i IN 1..75 LOOP
    INSERT INTO profiles (id, email, first_name, last_name, username, avatar_url, linkedin_url, is_admin, created_at, updated_at)
    VALUES (
      user_ids[i],
      LOWER(first_names[i]) || '.' || LOWER(last_names[i]) || '@example.com',
      first_names[i],
      last_names[i],
      LOWER(first_names[i]) || '_' || LOWER(last_names[i]),
      'https://api.dicebear.com/9.x/avataaars/png?seed=' || user_ids[i],
      CASE WHEN random() < 0.35
        THEN 'https://linkedin.com/in/' || LOWER(first_names[i]) || '-' || LOWER(last_names[i])
        ELSE NULL
      END,
      CASE WHEN i = 1 THEN TRUE ELSE FALSE END,
      NOW() - (random() * INTERVAL '30 days'),
      NOW() - (random() * INTERVAL '15 days')
    );
  END LOOP;

  ---------------------------------------------------------------------------
  -- 2. SPEAKING CLUBS (5 clubs)
  ---------------------------------------------------------------------------
  FOR i IN 1..5 LOOP
    INSERT INTO speaking_clubs (name, slug, description, translations, created_at, updated_at)
    VALUES (
      CASE i
        WHEN 1 THEN 'SpeakEasy Club'
        WHEN 2 THEN 'Fluent Speakers'
        WHEN 3 THEN 'English Hub'
        WHEN 4 THEN 'Confidence Talks'
        WHEN 5 THEN 'Global Orators'
      END,
      CASE i
        WHEN 1 THEN 'speakeasy'
        WHEN 2 THEN 'fluent-speakers'
        WHEN 3 THEN 'english-hub'
        WHEN 4 THEN 'confidence-talks'
        WHEN 5 THEN 'global-orators'
      END,
      CASE i
        WHEN 1 THEN 'A relaxed speaking club for intermediate learners to practice conversations.'
        WHEN 2 THEN 'Advanced speakers refining their fluency through structured debates.'
        WHEN 3 THEN 'All-level English practice with focus on vocabulary building.'
        WHEN 4 THEN 'Build your speaking confidence in a supportive environment.'
        WHEN 5 THEN 'International speakers discussing global topics.'
      END,
      CASE i
        WHEN 1 THEN '{"en":{"name":"SpeakEasy Club","description":"A relaxed speaking club for intermediate learners to practice conversations."},"uk":{"name":"SpeakEasy Club","description":"Розслаблений розмовний клуб для учнів середнього рівня."}}'
        WHEN 2 THEN '{"en":{"name":"Fluent Speakers","description":"Advanced speakers refining their fluency through structured debates."},"uk":{"name":"Fluent Speakers","description":"Просунуті мовці, які вдосконалюють свою вільність через структуровані дебати."}}'
        WHEN 3 THEN '{"en":{"name":"English Hub","description":"All-level English practice with focus on vocabulary building."},"uk":{"name":"English Hub","description":"Практика англійської для всіх рівнів з фокусом на розширення словникового запасу."}}'
        WHEN 4 THEN '{"en":{"name":"Confidence Talks","description":"Build your speaking confidence in a supportive environment."},"uk":{"name":"Confidence Talks","description":"Розвивайте впевненість у мовленні в підтримуючому середовищі."}}'
        WHEN 5 THEN '{"en":{"name":"Global Orators","description":"International speakers discussing global topics."},"uk":{"name":"Global Orators","description":"Міжнародні мовці, які обговорюють глобальні теми."}}'
      END::jsonb,
      NOW() - ((30 - i * 5)::INTEGER * INTERVAL '1 day'),
      NOW() - (floor(random() * 10)::INTEGER * INTERVAL '1 day')
    )
    RETURNING id INTO temp_club_id;
    club_ids := array_append(club_ids, temp_club_id);
  END LOOP;

  ---------------------------------------------------------------------------
  -- 3. CLUB MEMBERSHIPS
  --    Each club has 1 admin (user_2a0001 is master admin, club admins from pool)
  --    Club 1: users 2-21 (20 members), admin: user_2a0002
  --    Club 2: users 22-41 (20 members), admin: user_2a0003
  --    Club 3: users 42-56 (15 members), admin: user_2a0004
  --    Club 4: users 57-71 (15 members), admin: user_2a0005
  --    Club 5: users 2-11 (10 members, overlapping), admin: user_2a0006
  ---------------------------------------------------------------------------

  -- Club 1 admin
  INSERT INTO club_memberships (club_id, user_id, role, created_at)
  VALUES (club_ids[1], 'user_2a0002', 'admin', NOW() - INTERVAL '25 days');

  -- Club 1 members (users 2-21, skip user_2a0002 since already admin)
  FOR i IN 3..21 LOOP
    INSERT INTO club_memberships (club_id, user_id, role, created_at)
    VALUES (club_ids[1], user_ids[i], 'member', NOW() - (random() * INTERVAL '20 days'));
  END LOOP;

  -- Club 2 admin
  INSERT INTO club_memberships (club_id, user_id, role, created_at)
  VALUES (club_ids[2], 'user_2a0003', 'admin', NOW() - INTERVAL '22 days');

  -- Club 2 members (users 22-41)
  FOR i IN 22..41 LOOP
    INSERT INTO club_memberships (club_id, user_id, role, created_at)
    VALUES (club_ids[2], user_ids[i], 'member', NOW() - (random() * INTERVAL '18 days'));
  END LOOP;

  -- Club 3 admin
  INSERT INTO club_memberships (club_id, user_id, role, created_at)
  VALUES (club_ids[3], 'user_2a0004', 'admin', NOW() - INTERVAL '20 days');

  -- Club 3 members (users 42-56)
  FOR i IN 42..56 LOOP
    INSERT INTO club_memberships (club_id, user_id, role, created_at)
    VALUES (club_ids[3], user_ids[i], 'member', NOW() - (random() * INTERVAL '15 days'));
  END LOOP;

  -- Club 4 admin
  INSERT INTO club_memberships (club_id, user_id, role, created_at)
  VALUES (club_ids[4], 'user_2a0005', 'admin', NOW() - INTERVAL '18 days');

  -- Club 4 members (users 57-71)
  FOR i IN 57..71 LOOP
    INSERT INTO club_memberships (club_id, user_id, role, created_at)
    VALUES (club_ids[4], user_ids[i], 'member', NOW() - (random() * INTERVAL '12 days'));
  END LOOP;

  -- Club 5 admin
  INSERT INTO club_memberships (club_id, user_id, role, created_at)
  VALUES (club_ids[5], 'user_2a0006', 'admin', NOW() - INTERVAL '16 days');

  -- Club 5 members (users 2-11 except admin user_2a0006, overlapping with club 1)
  FOR i IN 2..11 LOOP
    CONTINUE WHEN i = 6;
    INSERT INTO club_memberships (club_id, user_id, role, created_at)
    VALUES (club_ids[5], user_ids[i], 'member', NOW() - (random() * INTERVAL '10 days'));
  END LOOP;

  ---------------------------------------------------------------------------
  -- 4. CERTIFICATE CLAIMS (65 approved + 10 pending, club-scoped)
  --    Club 1: 15 approved + 2 pending
  --    Club 2: 15 approved + 2 pending
  --    Club 3: 12 approved + 2 pending
  --    Club 4: 12 approved + 2 pending
  --    Club 5: 11 approved + 2 pending
  ---------------------------------------------------------------------------

  -- Club 1 claims (users 2-18 approved, users 19-20 pending)
  FOR i IN 2..18 LOOP
    claim_admin_fb_idx := 1 + floor(random() * array_length(claim_admin_feedback, 1))::INTEGER;
    INSERT INTO certificate_claims (user_id, club_id, status, slug, admin_feedback, english_level, speaking_clubs_count, hours_participated, background_template, created_at, updated_at)
    VALUES (
      user_ids[i], club_ids[1],
      'approved',
      generate_certificate_slug(),
      claim_admin_feedback[claim_admin_fb_idx],
      english_levels[1 + floor(random() * 6)::INTEGER],
      3 + floor(random() * 18)::INTEGER,
      20 + floor(random() * 180)::INTEGER,
      templates[1 + floor(random() * 6)::INTEGER],
      NOW() - ((20 + floor(random() * 20))::INTEGER * INTERVAL '1 day'),
      NOW() - (floor(random() * 10)::INTEGER * INTERVAL '1 day')
    )
    RETURNING id INTO temp_cert_id;
    cert_ids := array_append(cert_ids, temp_cert_id);
  END LOOP;

  FOR i IN 19..20 LOOP
    INSERT INTO certificate_claims (user_id, club_id, status, slug, english_level, speaking_clubs_count, hours_participated, background_template, created_at, updated_at)
    VALUES (
      user_ids[i], club_ids[1],
      'pending',
      generate_certificate_slug(),
      english_levels[1 + floor(random() * 4)::INTEGER],
      1 + floor(random() * 8)::INTEGER,
      5 + floor(random() * 40)::INTEGER,
      templates[1 + floor(random() * 3)::INTEGER],
      NOW() - (floor(random() * 7)::INTEGER * INTERVAL '1 day'),
      NOW() - (floor(random() * 3)::INTEGER * INTERVAL '1 day')
    );
  END LOOP;

  -- Club 2 claims (users 22-36 approved, users 37-38 pending)
  FOR i IN 22..36 LOOP
    claim_admin_fb_idx := 1 + floor(random() * array_length(claim_admin_feedback, 1))::INTEGER;
    INSERT INTO certificate_claims (user_id, club_id, status, slug, admin_feedback, english_level, speaking_clubs_count, hours_participated, background_template, created_at, updated_at)
    VALUES (
      user_ids[i], club_ids[2],
      'approved',
      generate_certificate_slug(),
      claim_admin_feedback[claim_admin_fb_idx],
      english_levels[1 + floor(random() * 6)::INTEGER],
      3 + floor(random() * 18)::INTEGER,
      20 + floor(random() * 180)::INTEGER,
      templates[1 + floor(random() * 6)::INTEGER],
      NOW() - ((20 + floor(random() * 20))::INTEGER * INTERVAL '1 day'),
      NOW() - (floor(random() * 10)::INTEGER * INTERVAL '1 day')
    )
    RETURNING id INTO temp_cert_id;
    cert_ids := array_append(cert_ids, temp_cert_id);
  END LOOP;

  FOR i IN 37..38 LOOP
    INSERT INTO certificate_claims (user_id, club_id, status, slug, english_level, speaking_clubs_count, hours_participated, background_template, created_at, updated_at)
    VALUES (
      user_ids[i], club_ids[2],
      'pending',
      generate_certificate_slug(),
      english_levels[1 + floor(random() * 4)::INTEGER],
      1 + floor(random() * 8)::INTEGER,
      5 + floor(random() * 40)::INTEGER,
      templates[1 + floor(random() * 3)::INTEGER],
      NOW() - (floor(random() * 7)::INTEGER * INTERVAL '1 day'),
      NOW() - (floor(random() * 3)::INTEGER * INTERVAL '1 day')
    );
  END LOOP;

  -- Club 3 claims (users 42-53 approved, users 54-55 pending)
  FOR i IN 42..53 LOOP
    claim_admin_fb_idx := 1 + floor(random() * array_length(claim_admin_feedback, 1))::INTEGER;
    INSERT INTO certificate_claims (user_id, club_id, status, slug, admin_feedback, english_level, speaking_clubs_count, hours_participated, background_template, created_at, updated_at)
    VALUES (
      user_ids[i], club_ids[3],
      'approved',
      generate_certificate_slug(),
      claim_admin_feedback[claim_admin_fb_idx],
      english_levels[1 + floor(random() * 6)::INTEGER],
      3 + floor(random() * 18)::INTEGER,
      20 + floor(random() * 180)::INTEGER,
      templates[1 + floor(random() * 6)::INTEGER],
      NOW() - ((20 + floor(random() * 20))::INTEGER * INTERVAL '1 day'),
      NOW() - (floor(random() * 10)::INTEGER * INTERVAL '1 day')
    )
    RETURNING id INTO temp_cert_id;
    cert_ids := array_append(cert_ids, temp_cert_id);
  END LOOP;

  FOR i IN 54..55 LOOP
    INSERT INTO certificate_claims (user_id, club_id, status, slug, english_level, speaking_clubs_count, hours_participated, background_template, created_at, updated_at)
    VALUES (
      user_ids[i], club_ids[3],
      'pending',
      generate_certificate_slug(),
      english_levels[1 + floor(random() * 4)::INTEGER],
      1 + floor(random() * 8)::INTEGER,
      5 + floor(random() * 40)::INTEGER,
      templates[1 + floor(random() * 3)::INTEGER],
      NOW() - (floor(random() * 7)::INTEGER * INTERVAL '1 day'),
      NOW() - (floor(random() * 3)::INTEGER * INTERVAL '1 day')
    );
  END LOOP;

  -- Club 4 claims (users 57-68 approved, users 69-70 pending)
  FOR i IN 57..68 LOOP
    claim_admin_fb_idx := 1 + floor(random() * array_length(claim_admin_feedback, 1))::INTEGER;
    INSERT INTO certificate_claims (user_id, club_id, status, slug, admin_feedback, english_level, speaking_clubs_count, hours_participated, background_template, created_at, updated_at)
    VALUES (
      user_ids[i], club_ids[4],
      'approved',
      generate_certificate_slug(),
      claim_admin_feedback[claim_admin_fb_idx],
      english_levels[1 + floor(random() * 6)::INTEGER],
      3 + floor(random() * 18)::INTEGER,
      20 + floor(random() * 180)::INTEGER,
      templates[1 + floor(random() * 6)::INTEGER],
      NOW() - ((20 + floor(random() * 20))::INTEGER * INTERVAL '1 day'),
      NOW() - (floor(random() * 10)::INTEGER * INTERVAL '1 day')
    )
    RETURNING id INTO temp_cert_id;
    cert_ids := array_append(cert_ids, temp_cert_id);
  END LOOP;

  FOR i IN 69..70 LOOP
    INSERT INTO certificate_claims (user_id, club_id, status, slug, english_level, speaking_clubs_count, hours_participated, background_template, created_at, updated_at)
    VALUES (
      user_ids[i], club_ids[4],
      'pending',
      generate_certificate_slug(),
      english_levels[1 + floor(random() * 4)::INTEGER],
      1 + floor(random() * 8)::INTEGER,
      5 + floor(random() * 40)::INTEGER,
      templates[1 + floor(random() * 3)::INTEGER],
      NOW() - (floor(random() * 7)::INTEGER * INTERVAL '1 day'),
      NOW() - (floor(random() * 3)::INTEGER * INTERVAL '1 day')
    );
  END LOOP;

  -- Club 5 claims (users 2-12 approved, users 13-14 pending — overlapping members)
  FOR i IN 2..12 LOOP
    claim_admin_fb_idx := 1 + floor(random() * array_length(claim_admin_feedback, 1))::INTEGER;
    INSERT INTO certificate_claims (user_id, club_id, status, slug, admin_feedback, english_level, speaking_clubs_count, hours_participated, background_template, created_at, updated_at)
    VALUES (
      user_ids[i], club_ids[5],
      'approved',
      generate_certificate_slug(),
      claim_admin_feedback[claim_admin_fb_idx],
      english_levels[1 + floor(random() * 6)::INTEGER],
      3 + floor(random() * 18)::INTEGER,
      20 + floor(random() * 180)::INTEGER,
      templates[1 + floor(random() * 6)::INTEGER],
      NOW() - ((20 + floor(random() * 20))::INTEGER * INTERVAL '1 day'),
      NOW() - (floor(random() * 10)::INTEGER * INTERVAL '1 day')
    )
    RETURNING id INTO temp_cert_id;
    cert_ids := array_append(cert_ids, temp_cert_id);
  END LOOP;

  ---------------------------------------------------------------------------
  -- 5. PEER FEEDBACK on approved certificates
  ---------------------------------------------------------------------------
  FOR i IN 1..array_length(cert_ids, 1) LOOP
    IF i <= 15 THEN
      num_feedback := 21 + floor(random() * 10)::INTEGER;
    ELSIF i <= 35 THEN
      num_feedback := 11 + floor(random() * 10)::INTEGER;
    ELSE
      num_feedback := 3 + floor(random() * 8)::INTEGER;
    END IF;

    used_reviewers := '{}';

    FOR j IN 1..num_feedback LOOP
      reviewer_idx := 1 + floor(random() * 65)::INTEGER;
      WHILE reviewer_idx = i OR reviewer_idx = 1 OR array_position(used_reviewers, reviewer_idx) IS NOT NULL LOOP
        reviewer_idx := 1 + floor(random() * 65)::INTEGER;
      END LOOP;
      used_reviewers := array_append(used_reviewers, reviewer_idx);

      feedback_idx := 1 + floor(random() * array_length(feedback_texts, 1))::INTEGER;
      has_linkedin := random() < 0.3;

      INSERT INTO certificate_feedback (certificate_id, reviewer_id, feedback_text, display_name_preference, linkedin_url, status, sort_order, is_visible, created_at, updated_at)
      VALUES (
        cert_ids[i],
        user_ids[reviewer_idx],
        feedback_texts[feedback_idx],
        CASE WHEN random() < 0.35 THEN 'full_name' ELSE 'nickname' END,
        CASE WHEN has_linkedin
          THEN 'https://linkedin.com/in/' || LOWER(first_names[reviewer_idx]) || '-' || LOWER(last_names[reviewer_idx])
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
  -- 6. ADMIN FEEDBACK on ~60% of approved certificates
  ---------------------------------------------------------------------------
  FOR i IN 1..array_length(cert_ids, 1) LOOP
    IF random() < 0.6 THEN
      admin_fb_idx := 1 + floor(random() * array_length(admin_feedback_texts, 1))::INTEGER;
      INSERT INTO certificate_feedback (certificate_id, reviewer_id, feedback_text, display_name_preference, status, sort_order, is_visible, created_at, updated_at)
      VALUES (
        cert_ids[i],
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
  -- 7. UPVOTES on approved certificates
  ---------------------------------------------------------------------------
  FOR i IN 1..array_length(cert_ids, 1) LOOP
    num_upvotes := 10 + floor(random() * 41)::INTEGER;
    FOR j IN 1..num_upvotes LOOP
      upvoter_idx := 1 + floor(random() * 65)::INTEGER;
      WHILE upvoter_idx = i LOOP
        upvoter_idx := 1 + floor(random() * 65)::INTEGER;
      END LOOP;
      BEGIN
        INSERT INTO certificate_upvotes (certificate_id, user_id, created_at)
        VALUES (
          cert_ids[i],
          user_ids[upvoter_idx],
          NOW() - ((5 + floor(random() * 20))::INTEGER * INTERVAL '1 day')
        );
      EXCEPTION WHEN SQLSTATE '23505' THEN
      END;
    END LOOP;
  END LOOP;

END $$;
