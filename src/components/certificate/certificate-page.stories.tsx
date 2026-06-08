import type { Meta, StoryObj } from "@storybook/react"
import { GuillocheSecurityCertificate } from "./templates/guilloche-security"
import { ModernGlassCertificate } from "./templates/modern-glass"
import { NeubrutalCertificate } from "./templates/neubrutal"
import { MemphisRetroCertificate } from "./templates/memphis-retro"
import { CyberNeonCertificate } from "./templates/cyber-neon"
import { NaturalGreenCertificate } from "./templates/natural-green"
import type { CertificateTemplateProps } from "./template"
import { UpvoteRosette } from "./upvote-rosette"
import { TestimonialsMarquee } from "./testimonials-marquee"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import "./guilloche-pattern.css"
import "./templates/modern-glass.css"
import "./templates/neubrutal.css"
import "./templates/memphis-retro.css"
import "./templates/cyber-neon.css"
import "./templates/natural-green.css"

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  username: string | null
  avatar_url: string | null
}

type FeedbackItem = {
  id: string
  feedback_text: string
  display_name_preference: string
  status: string
  sort_order: number
  is_visible: boolean
  created_at: string
  certificate_id: string
  linkedin_url: string | null
  reviewer_certificate_id: string | null
  profiles: Profile
}

const TESTIMONIALS: FeedbackItem[] = [
  { id: "fb-01", feedback_text: "I've seen Alex's progress firsthand — his dedication to improving his speaking skills is truly inspiring. Highly recommended!", display_name_preference: "full_name", status: "approved", sort_order: 1, is_visible: true, created_at: "2026-03-01T12:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: "cert-review-01", profiles: { id: "prof-01", first_name: "Sarah", last_name: "Chen", username: "sarahchen", avatar_url: null } },
  { id: "fb-02", feedback_text: "Amazing public speaker! Always brings energy to every conversation.", display_name_preference: "nickname", status: "approved", sort_order: 2, is_visible: true, created_at: "2026-03-02T14:00:00Z", certificate_id: "cert-1", linkedin_url: "https://linkedin.com/in/marcor", reviewer_certificate_id: "cert-review-02", profiles: { id: "prof-02", first_name: "Marco", last_name: "Rossi", username: "marcor", avatar_url: null } },
  { id: "fb-03", feedback_text: "Excellent command of English! I was really impressed by how fluently Alex can express complex ideas.", display_name_preference: "full_name", status: "approved", sort_order: 3, is_visible: true, created_at: "2026-03-03T09:00:00Z", certificate_id: "cert-1", linkedin_url: "https://linkedin.com/in/emma-w", reviewer_certificate_id: null, profiles: { id: "prof-03", first_name: "Emma", last_name: "Williams", username: "emmaw", avatar_url: null } },
  { id: "fb-04", feedback_text: "Great discussion partner. Always well-prepared and thoughtful.", display_name_preference: "nickname", status: "approved", sort_order: 4, is_visible: true, created_at: "2026-03-04T16:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: "cert-review-04", profiles: { id: "prof-04", first_name: "James", last_name: "Kim", username: "jamesk", avatar_url: null } },
  { id: "fb-05", feedback_text: "I've had many speaking club sessions with Alex and the improvement over time is remarkable. Keep it up!", display_name_preference: "full_name", status: "approved", sort_order: 5, is_visible: true, created_at: "2026-03-05T11:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: null, profiles: { id: "prof-05", first_name: "Yuki", last_name: "Tanaka", username: "yukit", avatar_url: null } },
  { id: "fb-06", feedback_text: "One of the most engaging speakers I've met on this platform. Truly fluent!", display_name_preference: "nickname", status: "approved", sort_order: 6, is_visible: true, created_at: "2026-03-06T08:00:00Z", certificate_id: "cert-1", linkedin_url: "https://linkedin.com/in/priya-s", reviewer_certificate_id: "cert-review-06", profiles: { id: "prof-06", first_name: "Priya", last_name: "Sharma", username: "priyas", avatar_url: null } },
  { id: "fb-07", feedback_text: "Alex's vocabulary and pronunciation are outstanding. A well-deserved certificate!", display_name_preference: "full_name", status: "approved", sort_order: 7, is_visible: true, created_at: "2026-03-07T15:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: null, profiles: { id: "prof-07", first_name: "Carlos", last_name: "Mendez", username: "carlosm", avatar_url: null } },
  { id: "fb-08", feedback_text: "Really enjoyable conversations. Alex is clear, confident, and articulate.", display_name_preference: "nickname", status: "approved", sort_order: 8, is_visible: true, created_at: "2026-03-08T10:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: "cert-review-08", profiles: { id: "prof-08", first_name: "Lena", last_name: "Fischer", username: "lenaf", avatar_url: null } },
  { id: "fb-09", feedback_text: "I've been in several speaking clubs with Alex and he consistently stands out. A real communicator!", display_name_preference: "full_name", status: "approved", sort_order: 9, is_visible: true, created_at: "2026-03-09T12:00:00Z", certificate_id: "cert-1", linkedin_url: "https://linkedin.com/in/ahmed-h", reviewer_certificate_id: "cert-review-09", profiles: { id: "prof-09", first_name: "Ahmed", last_name: "Hassan", username: "ahmedh", avatar_url: null } },
  { id: "fb-10", feedback_text: "Super friendly and always willing to help others improve their English too!", display_name_preference: "nickname", status: "approved", sort_order: 10, is_visible: true, created_at: "2026-03-10T09:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: null, profiles: { id: "prof-10", first_name: "Sofia", last_name: "Andersen", username: "sofiaa", avatar_url: null } },
  { id: "fb-11", feedback_text: "Alex has a natural gift for conversation. Every session with him is a pleasure.", display_name_preference: "full_name", status: "approved", sort_order: 11, is_visible: true, created_at: "2026-03-11T13:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: "cert-review-11", profiles: { id: "prof-11", first_name: "Dmitry", last_name: "Volkov", username: "dmitryv", avatar_url: null } },
  { id: "fb-12", feedback_text: "Incredible progress! From shy speaker to confident conversationalist.", display_name_preference: "nickname", status: "approved", sort_order: 12, is_visible: true, created_at: "2026-03-12T11:00:00Z", certificate_id: "cert-1", linkedin_url: "https://linkedin.com/in/olivia-p", reviewer_certificate_id: "cert-review-12", profiles: { id: "prof-12", first_name: "Olivia", last_name: "Park", username: "oliviap", avatar_url: null } },
  { id: "fb-13", feedback_text: "Very articulate and thoughtful. Alex brings great insights to every discussion.", display_name_preference: "full_name", status: "approved", sort_order: 13, is_visible: true, created_at: "2026-03-13T10:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: null, profiles: { id: "prof-13", first_name: "Thomas", last_name: "Mueller", username: "thomasm", avatar_url: null } },
  { id: "fb-14", feedback_text: "One of the best speakers I know on this platform. Highly fluent and natural.", display_name_preference: "nickname", status: "approved", sort_order: 14, is_visible: true, created_at: "2026-03-14T08:00:00Z", certificate_id: "cert-1", linkedin_url: "https://linkedin.com/in/nina-k", reviewer_certificate_id: "cert-review-14", profiles: { id: "prof-14", first_name: "Nina", last_name: "Kovács", username: "ninak", avatar_url: null } },
  { id: "fb-15", feedback_text: "Alex is a fantastic example of how dedication to practice pays off. Huge improvement!", display_name_preference: "full_name", status: "approved", sort_order: 15, is_visible: true, created_at: "2026-03-15T09:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: "cert-review-15", profiles: { id: "prof-15", first_name: "Wei", last_name: "Zhang", username: "weiz", avatar_url: null } },
  { id: "fb-16", feedback_text: "Always a joy to chat with. Alex makes every conversation interesting and fun.", display_name_preference: "nickname", status: "approved", sort_order: 16, is_visible: true, created_at: "2026-03-16T14:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: null, profiles: { id: "prof-16", first_name: "Maria", last_name: "Garcia", username: "mariag", avatar_url: null } },
  { id: "fb-17", feedback_text: "Alex's English level is truly advanced. Handles complex topics with ease.", display_name_preference: "full_name", status: "approved", sort_order: 17, is_visible: true, created_at: "2026-03-17T10:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: "cert-review-17", profiles: { id: "prof-17", first_name: "Hiroshi", last_name: "Nakamura", username: "hiroshin", avatar_url: null } },
  { id: "fb-18", feedback_text: "A wonderful communicator with a great sense of humor. Always a highlight of my week!", display_name_preference: "nickname", status: "approved", sort_order: 18, is_visible: true, created_at: "2026-03-18T11:00:00Z", certificate_id: "cert-1", linkedin_url: "https://linkedin.com/in/chloe-d", reviewer_certificate_id: null, profiles: { id: "prof-18", first_name: "Chloe", last_name: "Dubois", username: "chloed", avatar_url: null } },
  { id: "fb-19", feedback_text: "Alex is proof that consistent practice leads to mastery. Truly fluent speaker!", display_name_preference: "full_name", status: "approved", sort_order: 19, is_visible: true, created_at: "2026-03-19T12:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: "cert-review-19", profiles: { id: "prof-19", first_name: "Ravi", last_name: "Patel", username: "ravip", avatar_url: null } },
  { id: "fb-20", feedback_text: "Great energy, great vocabulary, great person. Alex is a true asset to any speaking club.", display_name_preference: "nickname", status: "approved", sort_order: 20, is_visible: true, created_at: "2026-03-20T09:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: null, profiles: { id: "prof-20", first_name: "Anna", last_name: "Bergström", username: "annab", avatar_url: null } },
  { id: "fb-21", feedback_text: "I'm always impressed by Alex's ability to lead a discussion and keep everyone engaged.", display_name_preference: "full_name", status: "approved", sort_order: 21, is_visible: true, created_at: "2026-03-21T15:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: "cert-review-21", profiles: { id: "prof-21", first_name: "Mohammed", last_name: "Al-Farsi", username: "mohammedf", avatar_url: null } },
  { id: "fb-22", feedback_text: "Alex's pronunciation and intonation are remarkably good. Near-native speaker!", display_name_preference: "nickname", status: "approved", sort_order: 22, is_visible: true, created_at: "2026-03-22T13:00:00Z", certificate_id: "cert-1", linkedin_url: "https://linkedin.com/in/isabel-t", reviewer_certificate_id: null, profiles: { id: "prof-22", first_name: "Isabel", last_name: "Torres", username: "isabelt", avatar_url: null } },
  { id: "fb-23", feedback_text: "Every conversation with Alex is a learning experience. He explains complex ideas so clearly.", display_name_preference: "full_name", status: "approved", sort_order: 23, is_visible: true, created_at: "2026-03-23T10:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: "cert-review-23", profiles: { id: "prof-23", first_name: "Katerina", last_name: "Petrova", username: "katerinap", avatar_url: null } },
  { id: "fb-24", feedback_text: "A fantastic speaking partner! Always brings interesting topics to the table.", display_name_preference: "nickname", status: "approved", sort_order: 24, is_visible: true, created_at: "2026-03-24T08:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: null, profiles: { id: "prof-24", first_name: "Liam", last_name: "O'Brien", username: "liamo", avatar_url: null } },
  { id: "fb-25", feedback_text: "Alex has mastered the art of conversation. Fluent, confident, and always respectful.", display_name_preference: "full_name", status: "approved", sort_order: 25, is_visible: true, created_at: "2026-03-25T11:00:00Z", certificate_id: "cert-1", linkedin_url: "https://linkedin.com/in/mei-l", reviewer_certificate_id: "cert-review-25", profiles: { id: "prof-25", first_name: "Mei", last_name: "Lin", username: "meil", avatar_url: null } },
  { id: "fb-26", feedback_text: "Such an enthusiastic learner! Alex's passion for English is contagious.", display_name_preference: "nickname", status: "approved", sort_order: 26, is_visible: true, created_at: "2026-03-26T09:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: null, profiles: { id: "prof-26", first_name: "Fatima", last_name: "El-Sayed", username: "fatimae", avatar_url: null } },
  { id: "fb-27", feedback_text: "I've had dozens of sessions with Alex and every single one was productive and fun.", display_name_preference: "full_name", status: "approved", sort_order: 27, is_visible: true, created_at: "2026-03-27T14:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: "cert-review-27", profiles: { id: "prof-27", first_name: "Viktor", last_name: "Ivanov", username: "viktori", avatar_url: null } },
  { id: "fb-28", feedback_text: "Alex's speaking skills are top-notch. A well-deserved certificate!", display_name_preference: "nickname", status: "approved", sort_order: 28, is_visible: true, created_at: "2026-03-28T10:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: "cert-review-28", profiles: { id: "prof-28", first_name: "Sophie", last_name: "Martin", username: "sophiem", avatar_url: null } },
  { id: "fb-29", feedback_text: "A brilliant conversationalist. Alex can talk about any subject with depth and clarity.", display_name_preference: "full_name", status: "approved", sort_order: 29, is_visible: true, created_at: "2026-03-29T12:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: null, profiles: { id: "prof-29", first_name: "Daniel", last_name: "Kowalski", username: "danielk", avatar_url: null } },
  { id: "fb-30", feedback_text: "I'm consistently impressed by Alex's fluency. He makes speaking English look effortless!", display_name_preference: "nickname", status: "approved", sort_order: 30, is_visible: true, created_at: "2026-03-30T15:00:00Z", certificate_id: "cert-1", linkedin_url: "https://linkedin.com/in/elena-v", reviewer_certificate_id: "cert-review-30", profiles: { id: "prof-30", first_name: "Elena", last_name: "Vasquez", username: "elenav", avatar_url: null } },
  { id: "fb-31", feedback_text: "Alex sets the standard for what a dedicated English learner can achieve. Bravo!", display_name_preference: "full_name", status: "approved", sort_order: 31, is_visible: true, created_at: "2026-03-31T09:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: null, profiles: { id: "prof-31", first_name: "Takuya", last_name: "Sato", username: "takuyas", avatar_url: null } },
  { id: "fb-32", feedback_text: "Every club needs an Alex — engaged, articulate, and encouraging to others.", display_name_preference: "nickname", status: "approved", sort_order: 32, is_visible: true, created_at: "2026-04-01T11:00:00Z", certificate_id: "cert-1", linkedin_url: "https://linkedin.com/in/laura-b", reviewer_certificate_id: "cert-review-32", profiles: { id: "prof-32", first_name: "Laura", last_name: "Bianchi", username: "laurab", avatar_url: null } },
  { id: "fb-33", feedback_text: "Alex has an incredible range of vocabulary and uses it naturally. A pleasure to listen to.", display_name_preference: "full_name", status: "approved", sort_order: 33, is_visible: true, created_at: "2026-04-02T13:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: "cert-review-33", profiles: { id: "prof-33", first_name: "Omar", last_name: "Saleh", username: "omars", avatar_url: null } },
  { id: "fb-34", feedback_text: "Impressive transformation! I've watched Alex grow from intermediate to advanced fluency.", display_name_preference: "nickname", status: "approved", sort_order: 34, is_visible: true, created_at: "2026-04-03T08:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: null, profiles: { id: "prof-34", first_name: "Hannah", last_name: "Schmidt", username: "hannahs", avatar_url: null } },
  { id: "fb-35", feedback_text: "Alex is one of the most fluent non-native speakers I've ever encountered. Truly impressive!", display_name_preference: "full_name", status: "approved", sort_order: 35, is_visible: true, created_at: "2026-04-04T10:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: "cert-review-35", profiles: { id: "prof-35", first_name: "Santiago", last_name: "Lopez", username: "santiagol", avatar_url: null } },
  { id: "fb-36", feedback_text: "Amazing discussion leader! Alex knows how to keep a conversation flowing naturally.", display_name_preference: "nickname", status: "approved", sort_order: 36, is_visible: true, created_at: "2026-04-05T14:00:00Z", certificate_id: "cert-1", linkedin_url: "https://linkedin.com/in/aya-n", reviewer_certificate_id: null, profiles: { id: "prof-36", first_name: "Aya", last_name: "Nakano", username: "ayan", avatar_url: null } },
  { id: "fb-37", feedback_text: "A true inspiration for anyone learning English. Alex proves hard work pays off!", display_name_preference: "full_name", status: "approved", sort_order: 37, is_visible: true, created_at: "2026-04-06T09:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: "cert-review-37", profiles: { id: "prof-37", first_name: "Rafael", last_name: "Costa", username: "rafaelc", avatar_url: null } },
  { id: "fb-38", feedback_text: "Alex's command of English is outstanding. Every session leaves me impressed.", display_name_preference: "nickname", status: "approved", sort_order: 38, is_visible: true, created_at: "2026-04-07T11:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: null, profiles: { id: "prof-38", first_name: "Ingrid", last_name: "Larsen", username: "ingridl", avatar_url: null } },
  { id: "fb-39", feedback_text: "I highly recommend Alex for anyone looking for a great conversation partner. Fluent and friendly!", display_name_preference: "full_name", status: "approved", sort_order: 39, is_visible: true, created_at: "2026-04-08T12:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: "cert-review-39", profiles: { id: "prof-39", first_name: "Aiko", last_name: "Yamamoto", username: "aikoy", avatar_url: null } },
  { id: "fb-40", feedback_text: "The progress Alex has made is phenomenal. From hesitant to completely fluent — incredible journey!", display_name_preference: "nickname", status: "approved", sort_order: 40, is_visible: true, created_at: "2026-04-09T10:00:00Z", certificate_id: "cert-1", linkedin_url: null, reviewer_certificate_id: null, profiles: { id: "prof-40", first_name: "David", last_name: "Cohen", username: "davidc", avatar_url: null } },
]

function buildTestimonials(count: number): FeedbackItem[] {
  return TESTIMONIALS.slice(0, count).map((t, i) => ({
    ...t,
    sort_order: i + 1,
  }))
}

interface CertificatePageLayoutProps {
  fullName: string
  englishLevel: string
  speakingClubsCount: number
  hoursParticipated: number | null
  adminFeedback: string | null
  createdAt: string
  slug: string
  upvoteCount: number
  hasUpvoted: boolean
  canUpvote: boolean
  testimonialCount: number
  templateId?: string
}

const templateComponents: Record<string, React.ComponentType<CertificateTemplateProps>> = {
  "guilloche-security": GuillocheSecurityCertificate,
  "modern-glass": ModernGlassCertificate,
  "neubrutal": NeubrutalCertificate,
  "memphis-retro": MemphisRetroCertificate,
  "cyber-neon": CyberNeonCertificate,
  "natural-green": NaturalGreenCertificate,
}

function CertificatePageLayout({
  fullName,
  englishLevel,
  speakingClubsCount,
  hoursParticipated,
  adminFeedback,
  createdAt,
  slug,
  upvoteCount,
  hasUpvoted,
  canUpvote,
  testimonialCount,
  templateId,
}: CertificatePageLayoutProps) {
  const Component = templateId ? templateComponents[templateId] : GuillocheSecurityCertificate

  return (
    <div className="min-h-screen bg-gradient-to-b from-bright-sky/5 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
          Back to FluencyCert
        </Link>

        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-start">
          <div className="flex-1">
            <Component
              fullName={fullName}
              englishLevel={englishLevel}
              speakingClubsCount={speakingClubsCount}
              hoursParticipated={hoursParticipated}
              adminFeedback={adminFeedback}
              createdAt={createdAt}
              slug={slug}
            />
          </div>

          <div className="flex shrink-0 justify-center lg:pt-12 lg:self-start">
            <UpvoteRosette
              slug={slug}
              initialCount={upvoteCount}
              initialHasUpvoted={hasUpvoted}
              canUpvote={canUpvote}
            />
          </div>
        </div>

        <TestimonialsMarquee feedbacks={buildTestimonials(testimonialCount)} />

        <div className="mt-12 border-t border-gray-100 py-6 text-center text-xs text-muted-foreground dark:border-gray-800">
          <p>FluencyCert — Verified English Speaking Certificates</p>
        </div>
      </div>
    </div>
  )
}

const meta: Meta<typeof CertificatePageLayout> = {
  title: "Certificate/Page",
  component: CertificatePageLayout,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    englishLevel: {
      control: "select",
      options: ["A1", "A2", "B1", "B2", "C1", "C2", "Native", "Not specified"],
    },
    testimonialCount: {
      control: { type: "number", min: 0, max: 40 },
    },
    speakingClubsCount: { control: { type: "number", min: 0 } },
    hoursParticipated: { control: { type: "number", min: 0 } },
    upvoteCount: { control: { type: "number", min: 0 } },
    hasUpvoted: { control: "boolean" },
    canUpvote: { control: "boolean" },
    adminFeedback: { control: "text" },
    templateId: {
      control: "select",
      options: ["guilloche-security", "modern-glass", "neubrutal", "memphis-retro", "cyber-neon", "natural-green"],
    },
  },
}

export default meta
type Story = StoryObj<typeof CertificatePageLayout>

export const Default: Story = {
  args: {
    fullName: "Alex Johnson",
    englishLevel: "C1",
    speakingClubsCount: 24,
    hoursParticipated: 48,
    adminFeedback: "Alex has shown remarkable improvement in fluency and confidence. A well-deserved certification.",
    createdAt: "2026-03-15T10:30:00Z",
    slug: "ABC123",
    upvoteCount: 42,
    hasUpvoted: false,
    canUpvote: true,
    testimonialCount: 10,
  },
}

export const OneTestimonial: Story = {
  args: {
    ...Default.args,
    testimonialCount: 1,
  },
}

export const TwoTestimonials: Story = {
  args: {
    ...Default.args,
    testimonialCount: 2,
  },
}

export const FiveTestimonials: Story = {
  args: {
    ...Default.args,
    testimonialCount: 5,
  },
}

export const TenTestimonials: Story = {
  args: {
    ...Default.args,
    testimonialCount: 10,
  },
}

export const TwelveTestimonials: Story = {
  args: {
    ...Default.args,
    testimonialCount: 12,
  },
}

export const FifteenTestimonials: Story = {
  args: {
    ...Default.args,
    testimonialCount: 15,
  },
}

export const TwentyTestimonials: Story = {
  args: {
    ...Default.args,
    testimonialCount: 20,
  },
}

export const TwentyFiveTestimonials: Story = {
  args: {
    ...Default.args,
    testimonialCount: 25,
  },
}

export const FortyTestimonials: Story = {
  args: {
    ...Default.args,
    testimonialCount: 40,
  },
}

export const NoAdminFeedback: Story = {
  args: {
    ...Default.args,
    adminFeedback: null,
    testimonialCount: 5,
  },
}

export const MinimalStats: Story = {
  args: {
    ...Default.args,
    englishLevel: "A2",
    speakingClubsCount: 3,
    hoursParticipated: null,
    adminFeedback: null,
    upvoteCount: 0,
    testimonialCount: 1,
  },
}

export const TopLevelNoHours: Story = {
  args: {
    ...Default.args,
    englishLevel: "Native",
    speakingClubsCount: 56,
    hoursParticipated: null,
    adminFeedback: "Exceptional fluency. Alex demonstrates native-level proficiency in all aspects of communication.",
    upvoteCount: 128,
    testimonialCount: 20,
  },
}

export const BeginnerJourney: Story = {
  args: {
    ...Default.args,
    fullName: "Maria Silva",
    englishLevel: "A1",
    speakingClubsCount: 8,
    hoursParticipated: 12,
    adminFeedback: "Great start! Maria shows enthusiasm and a willingness to learn. Keep practicing!",
    upvoteCount: 7,
    testimonialCount: 2,
  },
}

export const NoUpvotesNoFeedback: Story = {
  args: {
    ...Default.args,
    upvoteCount: 0,
    hasUpvoted: false,
    canUpvote: false,
    testimonialCount: 0,
  },
}

export const AuthenticatedUser: Story = {
  args: {
    ...Default.args,
    hasUpvoted: true,
    canUpvote: false,
    testimonialCount: 12,
  },
}

export const ModernGlassDefault: Story = {
  args: {
    ...Default.args,
    templateId: "modern-glass",
  },
}

export const ModernGlassNoHours: Story = {
  args: {
    ...Default.args,
    templateId: "modern-glass",
    hoursParticipated: null,
  },
}

export const ModernGlassNoFeedback: Story = {
  args: {
    ...Default.args,
    templateId: "modern-glass",
    adminFeedback: null,
    testimonialCount: 5,
  },
}

export const ModernGlassMinimal: Story = {
  args: {
    ...Default.args,
    templateId: "modern-glass",
    englishLevel: "A2",
    speakingClubsCount: 3,
    hoursParticipated: null,
    adminFeedback: null,
    upvoteCount: 0,
    testimonialCount: 1,
  },
}

export const ModernGlassPremium: Story = {
  args: {
    ...Default.args,
    templateId: "modern-glass",
    fullName: "Alex Johnson",
    englishLevel: "C2 (Proficient)",
    speakingClubsCount: 96,
    hoursParticipated: 240,
    adminFeedback: "Exceptional fluency. Alex demonstrates native-level proficiency across all CEFR criteria — outstanding vocabulary, precise grammar, and effortless pronunciation.",
    upvoteCount: 256,
    testimonialCount: 30,
  },
}

export const NeubrutalDefault: Story = {
  args: {
    ...Default.args,
    templateId: "neubrutal",
  },
}

export const NeubrutalNoHours: Story = {
  args: {
    ...Default.args,
    templateId: "neubrutal",
    hoursParticipated: null,
  },
}

export const NeubrutalNoFeedback: Story = {
  args: {
    ...Default.args,
    templateId: "neubrutal",
    adminFeedback: null,
    testimonialCount: 3,
  },
}

export const NeubrutalMinimal: Story = {
  args: {
    ...Default.args,
    templateId: "neubrutal",
    englishLevel: "A2",
    speakingClubsCount: 3,
    hoursParticipated: null,
    adminFeedback: null,
    upvoteCount: 0,
    testimonialCount: 0,
  },
}

export const MemphisRetroDefault: Story = {
  args: {
    ...Default.args,
    templateId: "memphis-retro",
  },
}

export const MemphisRetroNoHours: Story = {
  args: {
    ...Default.args,
    templateId: "memphis-retro",
    hoursParticipated: null,
  },
}

export const MemphisRetroNoFeedback: Story = {
  args: {
    ...Default.args,
    templateId: "memphis-retro",
    adminFeedback: null,
    testimonialCount: 5,
  },
}

export const MemphisRetroMinimal: Story = {
  args: {
    ...Default.args,
    templateId: "memphis-retro",
    englishLevel: "A1",
    speakingClubsCount: 2,
    hoursParticipated: null,
    adminFeedback: null,
    upvoteCount: 1,
    testimonialCount: 0,
  },
}

export const MemphisRetroPremium: Story = {
  args: {
    ...Default.args,
    templateId: "memphis-retro",
    fullName: "Elena Vasquez",
    englishLevel: "C2 (Proficient)",
    speakingClubsCount: 84,
    hoursParticipated: 200,
    adminFeedback: "Elena is a phenomenal speaker with near-native fluency. Her vocabulary range and pronunciation are exceptional.",
    upvoteCount: 189,
    testimonialCount: 25,
  },
}

export const CyberNeonDefault: Story = {
  args: {
    ...Default.args,
    templateId: "cyber-neon",
  },
}

export const CyberNeonNoHours: Story = {
  args: {
    ...Default.args,
    templateId: "cyber-neon",
    hoursParticipated: null,
  },
}

export const CyberNeonNoFeedback: Story = {
  args: {
    ...Default.args,
    templateId: "cyber-neon",
    adminFeedback: null,
    testimonialCount: 3,
  },
}

export const CyberNeonMinimal: Story = {
  args: {
    ...Default.args,
    templateId: "cyber-neon",
    englishLevel: "B1",
    speakingClubsCount: 6,
    hoursParticipated: null,
    adminFeedback: null,
    upvoteCount: 0,
    testimonialCount: 0,
  },
}

export const NaturalGreenDefault: Story = {
  args: {
    ...Default.args,
    templateId: "natural-green",
  },
}

export const NaturalGreenNoHours: Story = {
  args: {
    ...Default.args,
    templateId: "natural-green",
    hoursParticipated: null,
  },
}

export const NaturalGreenNoFeedback: Story = {
  args: {
    ...Default.args,
    templateId: "natural-green",
    adminFeedback: null,
    testimonialCount: 4,
  },
}

export const NaturalGreenMinimal: Story = {
  args: {
    ...Default.args,
    templateId: "natural-green",
    englishLevel: "A1",
    speakingClubsCount: 1,
    hoursParticipated: null,
    adminFeedback: null,
    upvoteCount: 0,
    testimonialCount: 0,
  },
}

export const NaturalGreenPremium: Story = {
  args: {
    ...Default.args,
    templateId: "natural-green",
    fullName: "Olivia Hart",
    englishLevel: "C2 (Proficient)",
    speakingClubsCount: 72,
    hoursParticipated: 180,
    adminFeedback: "Olivia's command of English is extraordinary — articulate, nuanced, and naturally fluent in every context.",
    upvoteCount: 145,
    testimonialCount: 20,
  },
}
