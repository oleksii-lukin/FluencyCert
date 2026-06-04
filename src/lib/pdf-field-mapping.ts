export type SourceType = 'database' | 'custom' | 'qr_code'

export interface DatabaseFieldDefinition {
  key: string
  label: string
  aliases: string[]
}

export const DATABASE_FIELD_MAP: DatabaseFieldDefinition[] = [
  {
    key: 'fullName',
    label: 'Full Name',
    aliases: [
      'fullname',
      'recipientname',
      'studentname',
      'name',
      'participantname',
      'membername',
      'username',
      'student',
      'holdername',
      'candidatename',
      'holder',
      'recipient',
      'participant',
    ],
  },
  {
    key: 'englishLevel',
    label: 'English Level',
    aliases: [
      'englishlevel',
      'level',
      'languagelevel',
      'proficiencylevel',
      'cefr',
      'cefrlevel',
      'english',
      'englevel',
      'englvl',
    ],
  },
  {
    key: 'speakingClubsCount',
    label: 'Speaking Clubs Count',
    aliases: [
      'speakingclubs',
      'clubs',
      'speakingclubscount',
      'clubcount',
      'clubsattended',
      'numberofclubs',
      'sessionsattended',
      'clubcount',
      'numclubs',
    ],
  },
  {
    key: 'hoursParticipated',
    label: 'Hours Participated',
    aliases: [
      'hours',
      'hoursparticipated',
      'hourscompleted',
      'studyhours',
      'practicehours',
      'totalhours',
      'participationhours',
      'learninghours',
      'numhours',
    ],
  },
  {
    key: 'adminFeedback',
    label: 'Admin Feedback',
    aliases: [
      'adminfeedback',
      'feedback',
      'note',
      'adminnote',
      'comment',
      'reviewnote',
      'verifiernote',
      'admincomment',
    ],
  },
  {
    key: 'createdAt',
    label: 'Created At',
    aliases: [
      'createdat',
      'date',
      'issuedon',
      'dateissued',
      'issuedate',
      'certificatedate',
      'grantdate',
      'completiondate',
      'datecreated',
    ],
  },
  {
    key: 'slug',
    label: 'Certificate Slug',
    aliases: [
      'slug',
      'certificateid',
      'id',
      'certid',
      'certificatenumber',
      'certnumber',
      'certificateslug',
      'certslug',
    ],
  },
]

export const QR_CODE_ALIASES = ['qrcode', 'qr']

export function inferFieldMapping(
  pdfFieldName: string,
): { source_type: SourceType; source_key: string | null } {
  const normalized = pdfFieldName.toLowerCase().replace(/[\s_-]/g, '')

  for (const alias of QR_CODE_ALIASES) {
    if (normalized === alias) {
      return { source_type: 'qr_code', source_key: null }
    }
  }

  for (const fieldDef of DATABASE_FIELD_MAP) {
    for (const alias of fieldDef.aliases) {
      if (normalized === alias) {
        return { source_type: 'database', source_key: fieldDef.key }
      }
    }
  }

  for (const fieldDef of DATABASE_FIELD_MAP) {
    for (const alias of fieldDef.aliases) {
      if (normalized.startsWith(alias) || normalized.endsWith(alias)) {
        return { source_type: 'database', source_key: fieldDef.key }
      }
    }
  }

  for (const fieldDef of DATABASE_FIELD_MAP) {
    for (const alias of fieldDef.aliases) {
      if (normalized.includes(alias)) {
        return { source_type: 'database', source_key: fieldDef.key }
      }
    }
  }

  return { source_type: 'custom', source_key: pdfFieldName }
}