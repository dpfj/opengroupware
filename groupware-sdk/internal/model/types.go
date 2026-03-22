package model

import "time"

// ── 공통 ────────────────────────────────────────────────────

type FileStatus   string
type DocStatus    string
type StepType     string
type StepStatus   string
type ChannelType  string
type BoardType    string
type PostStatus   string

const (
	FileActive   FileStatus = "ACTIVE"
	FileDeleted  FileStatus = "DELETED"

	DocDraft     DocStatus = "DRAFT"
	DocInReview  DocStatus = "IN_REVIEW"
	DocApproved  DocStatus = "APPROVED"
	DocRejected  DocStatus = "REJECTED"
	DocWithdrawn DocStatus = "WITHDRAWN"

	StepApproval  StepType = "APPROVAL"
	StepReview    StepType = "REVIEW"
	StepReference StepType = "REFERENCE"

	StepPending  StepStatus = "PENDING"
	StepApproved StepStatus = "APPROVED"
	StepRejected StepStatus = "REJECTED"
	StepReviewed StepStatus = "REVIEWED"
	StepSkipped  StepStatus = "SKIPPED"

	ChannelPublic  ChannelType = "PUBLIC"
	ChannelPrivate ChannelType = "PRIVATE"
	ChannelDM      ChannelType = "DM"

	BoardNotice   BoardType = "NOTICE"
	BoardGeneral  BoardType = "GENERAL"
	BoardResource BoardType = "RESOURCE"
	BoardQnA      BoardType = "QNA"

	PostDraft     PostStatus = "DRAFT"
	PostPublished PostStatus = "PUBLISHED"
	PostArchived  PostStatus = "ARCHIVED"
)

// ── 파일 ────────────────────────────────────────────────────

type FileMetadata struct {
	Key         string            `json:"key"`
	WorkspaceID string            `json:"workspace_id"`
	Size        int64             `json:"size"`
	ETag        string            `json:"etag"`
	ContentType string            `json:"content_type"`
	Status      FileStatus        `json:"status"`
	UploaderID  string            `json:"uploader_id"`
	Metadata    map[string]string `json:"metadata,omitempty"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

// ── 사용자 ───────────────────────────────────────────────────

type User struct {
	UserID      string    `json:"user_id"`
	Email       string    `json:"email"`
	DisplayName string    `json:"display_name"`
	Roles       []string  `json:"roles"`
	WorkspaceIDs []string `json:"workspace_ids"`
	CreatedAt   time.Time `json:"created_at"`
}

type TokenPair struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
}

// ── 전자결재 ─────────────────────────────────────────────────

type ApprovalStep struct {
	Order       int        `json:"order"`
	ApproverID  string     `json:"approver_id"`
	StepType    StepType   `json:"step_type"`
	Status      StepStatus `json:"status"`
	Comment     string     `json:"comment"`
	ActedAt     *time.Time `json:"acted_at,omitempty"`
}

type ApprovalDoc struct {
	ID           string                 `json:"id"`
	WorkspaceID  string                 `json:"workspace_id"`
	AuthorID     string                 `json:"author_id"`
	Title        string                 `json:"title"`
	TemplateID   string                 `json:"template_id"`
	Content      map[string]interface{} `json:"content"`
	Steps        []ApprovalStep         `json:"steps"`
	Status       DocStatus              `json:"status"`
	AttachKeys   []string               `json:"attach_keys"`
	RejectReason string                 `json:"reject_reason,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
	SubmittedAt  *time.Time             `json:"submitted_at,omitempty"`
	ClosedAt     *time.Time             `json:"closed_at,omitempty"`
}

type ApprovalEvent struct {
	DocID      string    `json:"doc_id"`
	ActorID    string    `json:"actor_id"`
	Action     string    `json:"action"`
	Comment    string    `json:"comment"`
	StepOrder  *int      `json:"step_order,omitempty"`
	OccurredAt time.Time `json:"occurred_at"`
}

// ── 공지사항 ─────────────────────────────────────────────────

type Post struct {
	ID          string     `json:"id"`
	WorkspaceID string     `json:"workspace_id"`
	AuthorID    string     `json:"author_id"`
	BoardType   BoardType  `json:"board_type"`
	Title       string     `json:"title"`
	Body        string     `json:"body"`
	Status      PostStatus `json:"status"`
	IsPinned    bool       `json:"is_pinned"`
	IsImportant bool       `json:"is_important"`
	AttachKeys  []string   `json:"attach_keys"`
	Tags        []string   `json:"tags"`
	ViewCount   int        `json:"view_count"`
	LikeCount   int        `json:"like_count"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
}

type Comment struct {
	ID        string    `json:"id"`
	PostID    string    `json:"post_id"`
	AuthorID  string    `json:"author_id"`
	Body      string    `json:"body"`
	ParentID  string    `json:"parent_id,omitempty"`
	IsDeleted bool      `json:"is_deleted"`
	CreatedAt time.Time `json:"created_at"`
}

// ── 메신저 ───────────────────────────────────────────────────

type Channel struct {
	ID          string      `json:"id"`
	WorkspaceID string      `json:"workspace_id"`
	CreatorID   string      `json:"creator_id"`
	Name        string      `json:"name"`
	ChannelType ChannelType `json:"channel_type"`
	Description string      `json:"description"`
	MemberIDs   []string    `json:"member_ids"`
	IsArchived  bool        `json:"is_archived"`
	CreatedAt   time.Time   `json:"created_at"`
}

type Message struct {
	ID         string            `json:"id"`
	ChannelID  string            `json:"channel_id"`
	AuthorID   string            `json:"author_id"`
	Text       string            `json:"text"`
	FileKey    string            `json:"file_key,omitempty"`
	ThreadID   string            `json:"thread_id,omitempty"`
	MentionIDs []string          `json:"mention_ids,omitempty"`
	Reactions  map[string]int    `json:"reactions,omitempty"`
	IsEdited   bool              `json:"is_edited"`
	IsDeleted  bool              `json:"is_deleted"`
	CreatedAt  time.Time         `json:"created_at"`
	UpdatedAt  time.Time         `json:"updated_at"`
}

// ── 캘린더 ───────────────────────────────────────────────────

type CalEvent struct {
	ID          string     `json:"id"`
	WorkspaceID string     `json:"workspace_id"`
	OrganizerID string     `json:"organizer_id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Location    string     `json:"location"`
	StartAt     time.Time  `json:"start_at"`
	EndAt       time.Time  `json:"end_at"`
	AllDay      bool       `json:"all_day"`
	IsCancelled bool       `json:"is_cancelled"`
	Attendees   []Attendee `json:"attendees"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type Attendee struct {
	UserID      string    `json:"user_id"`
	IsOrganizer bool      `json:"is_organizer"`
	Status      string    `json:"status"` // ACCEPTED / DECLINED / PENDING
	RespondedAt *time.Time `json:"responded_at,omitempty"`
}

// ── SSE 이벤트 ───────────────────────────────────────────────

type SSEEvent struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"`
	Topic       string                 `json:"topic"`
	Payload     map[string]interface{} `json:"payload"`
	WorkspaceID string                 `json:"workspace_id"`
	OccurredAt  time.Time              `json:"occurred_at"`
}
