export type FieldType = "string" | "number" | "boolean" | "textarea" | "date" | "array";

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  readOnly?: boolean;
  listVisible?: boolean; // shown as a column in the list view
  // Renders a dropdown of another collection's docs (value = doc id).
  refCollection?: string;
  refLabelKey?: string;
}

export interface RelatedCollection {
  collection: string;
  filterField: string;
}

export interface CollectionSchema {
  name: string;
  label: string;
  fields: FieldSchema[];
  relatedCollections?: RelatedCollection[];
  // Field shown (as the row link) in place of the raw doc ID in list views.
  primaryKey?: string;
  // Field holding a user uid; the API adds user_email / user_name for it.
  userLookupField?: string;
  // Field keys shown on the "New" form; presence enables creating records.
  createFields?: string[];
  // Adds a readable label (`as`) for fields that hold another doc's id.
  refLookups?: { field: string; collection: string; labelKey: string; as: string }[];
}

export const ADMIN_SCHEMAS: Record<string, CollectionSchema> = {
  users: {
    name: "users",
    label: "Users",
    primaryKey: "email",
    relatedCollections: [
      { collection: "protocols", filterField: "user" },
      { collection: "meals", filterField: "user" },
      { collection: "movementPractices", filterField: "user" },
      { collection: "journeyPhases", filterField: "user" },
      { collection: "milestones", filterField: "user" },
    ],
    fields: [
      { key: "email", label: "Email", type: "string", readOnly: true, listVisible: true },
      { key: "signed_up", label: "Signed up", type: "date", readOnly: true, listVisible: true },
      { key: "first_name", label: "First name", type: "string", listVisible: true },
      { key: "age", label: "Age", type: "number", listVisible: true },
      { key: "is_admin", label: "Admin", type: "boolean", listVisible: true },
      { key: "journey_type", label: "Journey type", type: "string", listVisible: true },
      { key: "onboarding_done", label: "Onboarding done", type: "boolean" },
      { key: "fertility_score", label: "Fertility score", type: "number" },
      { key: "current_protocol", label: "Current protocol (id)", type: "string", readOnly: true },
      { key: "current_week_number", label: "Current week", type: "number" },
      { key: "current_week", label: "Current week (alt)", type: "number" },
      { key: "pregnant_boolean", label: "Pregnant", type: "boolean" },
      { key: "target_conception_season", label: "Target conception season", type: "string" },
      { key: "previous_children", label: "Previous children", type: "number" },
      { key: "city", label: "City", type: "string", listVisible: true },
      { key: "country", label: "Country", type: "string" },
      { key: "nationality", label: "Nationality", type: "string" },
      { key: "job_type", label: "Job type", type: "string" },
      { key: "activity_level", label: "Activity level", type: "string" },
      { key: "diet_type", label: "Diet type", type: "string" },
      { key: "sun_exposure", label: "Sun exposure", type: "string" },
      { key: "skin_type", label: "Skin type", type: "string" },
      { key: "partner_age", label: "Partner age", type: "number" },
      { key: "partner_job_type", label: "Partner job type", type: "string" },
      { key: "partner_activity", label: "Partner activity", type: "string" },
      { key: "partner_diet", label: "Partner diet", type: "string" },
      { key: "due_date", label: "Due date", type: "date" },
      { key: "web_push_subscription", label: "Web push subscribed", type: "boolean", readOnly: true },
    ],
  },
  protocols: {
    name: "protocols",
    label: "Protocols",
    primaryKey: "user_email",
    userLookupField: "user",
    fields: [
      { key: "user_email", label: "Email", type: "string", readOnly: true, listVisible: true },
      { key: "user_name", label: "First name", type: "string", readOnly: true, listVisible: true },
      { key: "user", label: "User (uid)", type: "string", readOnly: true },
      { key: "nutrition_plan", label: "Nutrition plan", type: "textarea", listVisible: true },
      { key: "supplements", label: "Supplements", type: "textarea" },
      { key: "movement", label: "Movement", type: "textarea" },
      { key: "avoid_today", label: "Avoid today", type: "textarea" },
      { key: "fertility_tip", label: "Fertility tip", type: "textarea" },
      { key: "female_risk_summary", label: "Female risk summary", type: "textarea" },
      { key: "male_risk_summary", label: "Male risk summary", type: "textarea" },
      { key: "Created Date", label: "Created", type: "date", readOnly: true, listVisible: true },
      { key: "Modified Date", label: "Modified", type: "date", readOnly: true },
    ],
  },
  meals: {
    name: "meals",
    label: "Meals",
    primaryKey: "user_email",
    userLookupField: "user",
    fields: [
      { key: "user_email", label: "Email", type: "string", readOnly: true, listVisible: true },
      { key: "protocol", label: "Protocol (id)", type: "string", readOnly: true },
      { key: "user", label: "User (uid)", type: "string", readOnly: true },
      { key: "meal_type", label: "Meal type", type: "string", listVisible: true },
      { key: "name", label: "Name", type: "string", listVisible: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "nutrients", label: "Nutrients", type: "textarea", listVisible: true },
      { key: "mother_benefit", label: "Mother benefit", type: "textarea", listVisible: true },
      { key: "baby_benefit", label: "Baby benefit", type: "textarea", listVisible: true },
    ],
  },
  movementPractices: {
    name: "movementPractices",
    label: "Movement Practices",
    primaryKey: "user_email",
    userLookupField: "user",
    fields: [
      { key: "user_email", label: "Email", type: "string", readOnly: true, listVisible: true },
      { key: "user", label: "User (uid)", type: "string", readOnly: true },
      { key: "protocol", label: "Protocol (id)", type: "string", readOnly: true },
      { key: "practice_id", label: "Practice ID", type: "string", readOnly: true },
      { key: "title", label: "Title", type: "string", listVisible: true },
      { key: "subtitle", label: "Subtitle", type: "string", listVisible: true },
      { key: "duration", label: "Duration", type: "string", listVisible: true },
      { key: "category", label: "Category", type: "string", listVisible: true },
      { key: "why", label: "Why", type: "textarea", listVisible: true },
      { key: "guidance", label: "Guidance", type: "textarea", listVisible: true },
      { key: "exercises_json", label: "Exercises", type: "array" },
    ],
  },
  journeyPhases: {
    name: "journeyPhases",
    label: "Journey Phases",
    primaryKey: "user_email",
    userLookupField: "user",
    fields: [
      { key: "user_email", label: "Email", type: "string", readOnly: true, listVisible: true },
      { key: "user", label: "User (uid)", type: "string", readOnly: true },
      { key: "protocol", label: "Protocol (id)", type: "string", readOnly: true },
      { key: "phase_number", label: "Phase #", type: "number", listVisible: true },
      { key: "title", label: "Title", type: "string", listVisible: true },
      { key: "week_range", label: "Week range", type: "string", listVisible: true },
      { key: "status", label: "Status", type: "string", listVisible: true },
    ],
  },
  milestones: {
    name: "milestones",
    label: "Milestones",
    primaryKey: "user_email",
    userLookupField: "user",
    fields: [
      { key: "user_email", label: "Email", type: "string", readOnly: true, listVisible: true },
      { key: "user", label: "User (uid)", type: "string", readOnly: true },
      { key: "phase", label: "Phase (id)", type: "string", readOnly: true },
      { key: "week_label", label: "Week label", type: "string", listVisible: true },
      { key: "title", label: "Title", type: "string", listVisible: true },
      { key: "status", label: "Status", type: "string", listVisible: true },
      { key: "summary", label: "Summary", type: "textarea", listVisible: true },
      { key: "what_happening", label: "What's happening", type: "textarea", listVisible: true },
      { key: "focus_goals", label: "Focus goals", type: "textarea", listVisible: true },
      { key: "actions", label: "Actions", type: "textarea", listVisible: true },
    ],
  },
  weekDetails: {
    name: "weekDetails",
    label: "Week Details",
    primaryKey: "user_email",
    userLookupField: "user",
    fields: [
      { key: "user_email", label: "Email", type: "string", readOnly: true, listVisible: true },
      { key: "user", label: "User (uid)", type: "string", readOnly: true },
      { key: "week_number", label: "Week #", type: "number", listVisible: true },
      { key: "trimester", label: "Trimester", type: "string", listVisible: true },
      { key: "baby_milestone", label: "Baby milestone", type: "textarea", listVisible: true },
      { key: "nutrition_focus", label: "Nutrition focus", type: "textarea", listVisible: true },
      { key: "movement_focus", label: "Movement focus", type: "textarea", listVisible: true },
      { key: "supplements", label: "Supplements", type: "textarea", listVisible: true },
      { key: "appointments", label: "Appointments", type: "textarea", listVisible: true },
      { key: "avoid_today", label: "Avoid today", type: "textarea", listVisible: true },
      { key: "job_note", label: "Job note", type: "textarea", listVisible: true },
      { key: "Created Date", label: "Created", type: "date", readOnly: true, listVisible: true },
      { key: "Modified Date", label: "Modified", type: "date", readOnly: true },
      { key: "Created By", label: "Created by", type: "string", readOnly: true },
    ],
  },
  recoveryDetails: {
    name: "recoveryDetails",
    label: "Recovery Details (global)",
    primaryKey: "week_number",
    fields: [
      { key: "week_number", label: "Week #", type: "number", listVisible: true },
      { key: "phase", label: "Phase", type: "string", listVisible: true },
      { key: "hormone_note", label: "Hormone note", type: "textarea", listVisible: true },
      { key: "nutrition_focus", label: "Nutrition focus", type: "textarea", listVisible: true },
      { key: "movement_focus", label: "Movement focus", type: "textarea", listVisible: true },
      { key: "supplements", label: "Supplements", type: "textarea", listVisible: true },
      { key: "priorities", label: "Priorities", type: "textarea", listVisible: true },
      { key: "checkups", label: "Checkups", type: "textarea", listVisible: true },
      { key: "avoid_today", label: "Avoid today", type: "textarea", listVisible: true },
      { key: "job_note", label: "Job note", type: "textarea", listVisible: true },
    ],
  },
  groups: {
    name: "groups",
    label: "Groups",
    primaryKey: "name",
    createFields: ["name", "category"],
    fields: [
      { key: "name", label: "Name", type: "string", listVisible: true },
      { key: "category", label: "Category", type: "string", listVisible: true },
      { key: "member_count", label: "Member count", type: "number", listVisible: true },
      { key: "members", label: "Members (uids)", type: "array" },
    ],
  },
  posts: {
    name: "posts",
    label: "Posts",
    primaryKey: "author_name",
    createFields: ["group", "content", "Image", "author_name"],
    refLookups: [{ field: "group", collection: "groups", labelKey: "name", as: "group_name" }],
    fields: [
      { key: "author_name", label: "Author", type: "string", listVisible: true },
      { key: "group_name", label: "Group", type: "string", readOnly: true, listVisible: true },
      { key: "content", label: "Content", type: "textarea", listVisible: true },
      { key: "likes", label: "Likes", type: "number", listVisible: true },
      { key: "Created Date", label: "Created", type: "date", readOnly: true, listVisible: true },
      { key: "group", label: "Group (blank = general feed)", type: "string", refCollection: "groups", refLabelKey: "name" },
      { key: "Image", label: "Image URL", type: "string" },
      { key: "author", label: "Author (uid)", type: "string", readOnly: true },
      { key: "likedBy", label: "Liked by", type: "array" },
    ],
  },
  comments: {
    name: "comments",
    label: "Comments",
    primaryKey: "user_email",
    userLookupField: "author",
    refLookups: [{ field: "post", collection: "posts", labelKey: "content", as: "post_content" }],
    fields: [
      { key: "user_email", label: "Author", type: "string", readOnly: true, listVisible: true },
      { key: "post_content", label: "On post", type: "string", readOnly: true, listVisible: true },
      { key: "content", label: "Comment", type: "textarea", listVisible: true },
      { key: "Created Date", label: "Created", type: "date", readOnly: true, listVisible: true },
      { key: "post", label: "Post (id)", type: "string", readOnly: true },
      { key: "author", label: "Author (uid)", type: "string", readOnly: true },
    ],
  },
  groupMessages: {
    name: "groupMessages",
    label: "Group Messages",
    primaryKey: "sender_name",
    refLookups: [{ field: "group", collection: "groups", labelKey: "name", as: "group_name" }],
    fields: [
      { key: "sender_name", label: "Sender", type: "string", listVisible: true },
      { key: "group_name", label: "Group", type: "string", readOnly: true, listVisible: true },
      { key: "content", label: "Message", type: "textarea", listVisible: true },
      { key: "Created Date", label: "Created", type: "date", readOnly: true, listVisible: true },
      { key: "group", label: "Group (id)", type: "string", readOnly: true },
      { key: "sender", label: "Sender (uid)", type: "string", readOnly: true },
    ],
  },
};

export const ADMIN_COLLECTIONS = Object.keys(ADMIN_SCHEMAS);
