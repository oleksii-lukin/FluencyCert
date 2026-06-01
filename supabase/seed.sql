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
  -- 2. CERTIFICATE CLAIMS (65 approved + 10 pending)
  ---------------------------------------------------------------------------
  FOR i IN 1..65 LOOP
    claim_admin_fb_idx := 1 + floor(random() * array_length(claim_admin_feedback, 1))::INTEGER;
    INSERT INTO certificate_claims (user_id, status, admin_feedback, english_level, speaking_clubs_count, hours_participated, background_template, created_at, updated_at)
    VALUES (
      user_ids[i],
      'approved',
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

  FOR i IN 66..75 LOOP
    INSERT INTO certificate_claims (user_id, status, english_level, speaking_clubs_count, hours_participated, background_template, created_at, updated_at)
    VALUES (
      user_ids[i],
      'pending',
      english_levels[1 + floor(random() * 4)::INTEGER],
      1 + floor(random() * 8)::INTEGER,
      5 + floor(random() * 40)::INTEGER,
      templates[1 + floor(random() * 3)::INTEGER],
      NOW() - (floor(random() * 7)::INTEGER * INTERVAL '1 day'),
      NOW() - (floor(random() * 3)::INTEGER * INTERVAL '1 day')
    );
  END LOOP;

  ---------------------------------------------------------------------------
  -- 3. PEER FEEDBACK on approved certificates
  --    15 certs with 21-30 feedback (3 rows), 20 with 11-20 (2 rows),
  --    30 with 3-10 (1 row).  Tracks used reviewers per cert to avoid dupes.
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
  -- 4. ADMIN FEEDBACK on ~60% of approved certificates
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
  -- 5. UPVOTES on approved certificates
  --    Each cert gets 10-50 upvotes from random approved users.
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
