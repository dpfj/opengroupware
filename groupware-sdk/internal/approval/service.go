package approval

import (
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/groupware/sdk/internal/model"
)

var (
	ErrNotFound      = errors.New("결재 문서를 찾을 수 없습니다")
	ErrUnauthorized  = errors.New("권한이 없습니다")
	ErrInvalidStatus = errors.New("현재 상태에서 불가능한 작업입니다")
	ErrNoSteps       = errors.New("결재선이 없습니다")
	ErrNoReason      = errors.New("반려 사유는 필수입니다")
	ErrNotMyTurn     = errors.New("현재 결재자가 아닙니다")
)

// currentStep 현재 대기 중인 단계 반환 (approval 패키지 내부 함수)
func currentStep(doc *model.ApprovalDoc) *model.ApprovalStep {
	for i := range doc.Steps {
		if doc.Steps[i].Status == model.StepPending {
			return &doc.Steps[i]
		}
	}
	return nil
}

type Service struct {
	mu      sync.RWMutex
	docs    map[string]*model.ApprovalDoc
	history map[string][]model.ApprovalEvent

	OnApproved  func(doc *model.ApprovalDoc)
	OnRejected  func(doc *model.ApprovalDoc)
	OnSubmitted func(doc *model.ApprovalDoc)
	OnStepMoved func(doc *model.ApprovalDoc, nextApproverID string)
}

func NewService() *Service {
	return &Service{
		docs:    make(map[string]*model.ApprovalDoc),
		history: make(map[string][]model.ApprovalEvent),
	}
}

func (s *Service) Create(authorID, workspaceID, title, templateID string,
	content map[string]interface{},
	stepDefs []map[string]string,
	attachKeys []string,
) (*model.ApprovalDoc, error) {
	if len(stepDefs) == 0 {
		return nil, ErrNoSteps
	}
	steps := make([]model.ApprovalStep, 0, len(stepDefs))
	for i, def := range stepDefs {
		st := model.StepApproval
		if t, ok := def["step_type"]; ok {
			st = model.StepType(t)
		}
		steps = append(steps, model.ApprovalStep{
			Order:      i + 1,
			ApproverID: def["approver_id"],
			StepType:   st,
			Status:     model.StepPending,
		})
	}
	now := time.Now()
	doc := &model.ApprovalDoc{
		ID:          uuid.New().String(),
		WorkspaceID: workspaceID,
		AuthorID:    authorID,
		Title:       title,
		TemplateID:  templateID,
		Content:     content,
		Steps:       steps,
		Status:      model.DocDraft,
		AttachKeys:  attachKeys,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	s.mu.Lock()
	s.docs[doc.ID] = doc
	s.history[doc.ID] = []model.ApprovalEvent{}
	s.mu.Unlock()
	return doc, nil
}

func (s *Service) Submit(docID, submitterID string) (*model.ApprovalDoc, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	doc, err := s.get(docID)
	if err != nil {
		return nil, err
	}
	if doc.AuthorID != submitterID {
		return nil, ErrUnauthorized
	}
	if doc.Status != model.DocDraft {
		return nil, ErrInvalidStatus
	}
	now := time.Now()
	doc.Status = model.DocInReview
	doc.SubmittedAt = &now
	doc.UpdatedAt = now
	s.addEvent(docID, "submit", submitterID, "", nil)
	cp := s.copy(doc)

	go func() {
		if s.OnSubmitted != nil {
			s.OnSubmitted(cp)
		}
		if step := currentStep(cp); step != nil && s.OnStepMoved != nil {
			s.OnStepMoved(cp, step.ApproverID)
		}
	}()
	return cp, nil
}

func (s *Service) Approve(docID, approverID, comment string) (*model.ApprovalDoc, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	doc, err := s.get(docID)
	if err != nil {
		return nil, err
	}
	if doc.Status != model.DocInReview {
		return nil, ErrInvalidStatus
	}
	step := currentStep(doc)
	if step == nil {
		return nil, ErrInvalidStatus
	}
	if step.ApproverID != approverID {
		return nil, ErrNotMyTurn
	}
	if step.StepType == model.StepReview {
		step.Status = model.StepReviewed
	} else {
		step.Status = model.StepApproved
	}
	step.Comment = comment
	now := time.Now()
	step.ActedAt = &now
	doc.UpdatedAt = now
	s.addEvent(docID, "approve", approverID, comment, &step.Order)

	isFinal := currentStep(doc) == nil
	if isFinal {
		doc.Status = model.DocApproved
		doc.ClosedAt = &now
	}
	cp := s.copy(doc)

	go func() {
		if isFinal && s.OnApproved != nil {
			s.OnApproved(cp)
		} else if !isFinal {
			if next := currentStep(cp); next != nil && s.OnStepMoved != nil {
				s.OnStepMoved(cp, next.ApproverID)
			}
		}
	}()
	return cp, nil
}

func (s *Service) Reject(docID, approverID, reason string) (*model.ApprovalDoc, error) {
	if reason == "" {
		return nil, ErrNoReason
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	doc, err := s.get(docID)
	if err != nil {
		return nil, err
	}
	if doc.Status != model.DocInReview {
		return nil, ErrInvalidStatus
	}
	step := currentStep(doc)
	if step == nil {
		return nil, ErrInvalidStatus
	}
	if step.ApproverID != approverID {
		return nil, ErrNotMyTurn
	}
	step.Status = model.StepRejected
	step.Comment = reason
	now := time.Now()
	step.ActedAt = &now
	for i := range doc.Steps {
		if doc.Steps[i].Order > step.Order && doc.Steps[i].Status == model.StepPending {
			doc.Steps[i].Status = model.StepSkipped
		}
	}
	doc.Status = model.DocRejected
	doc.RejectReason = reason
	doc.ClosedAt = &now
	doc.UpdatedAt = now
	s.addEvent(docID, "reject", approverID, reason, &step.Order)
	cp := s.copy(doc)

	go func() {
		if s.OnRejected != nil {
			s.OnRejected(cp)
		}
	}()
	return cp, nil
}

func (s *Service) Withdraw(docID, requesterID string) (*model.ApprovalDoc, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	doc, err := s.get(docID)
	if err != nil {
		return nil, err
	}
	if doc.AuthorID != requesterID {
		return nil, ErrUnauthorized
	}
	if doc.Status != model.DocInReview {
		return nil, ErrInvalidStatus
	}
	for i := range doc.Steps {
		if doc.Steps[i].Status == model.StepPending {
			doc.Steps[i].Status = model.StepSkipped
		}
	}
	now := time.Now()
	doc.Status = model.DocWithdrawn
	doc.ClosedAt = &now
	doc.UpdatedAt = now
	s.addEvent(docID, "withdraw", requesterID, "", nil)
	return s.copy(doc), nil
}

func (s *Service) Get(docID string) (*model.ApprovalDoc, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	doc, err := s.get(docID)
	if err != nil {
		return nil, err
	}
	return s.copy(doc), nil
}

func (s *Service) History(docID string) ([]model.ApprovalEvent, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if _, err := s.get(docID); err != nil {
		return nil, err
	}
	h := s.history[docID]
	out := make([]model.ApprovalEvent, len(h))
	copy(out, h)
	return out, nil
}

func (s *Service) ListPending(approverID, workspaceID string) []*model.ApprovalDoc {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []*model.ApprovalDoc
	for _, doc := range s.docs {
		if doc.WorkspaceID != workspaceID || doc.Status != model.DocInReview {
			continue
		}
		if step := currentStep(doc); step != nil && step.ApproverID == approverID {
			out = append(out, s.copy(doc))
		}
	}
	return out
}

func (s *Service) ListByAuthor(authorID, workspaceID string) []*model.ApprovalDoc {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []*model.ApprovalDoc
	for _, doc := range s.docs {
		if doc.AuthorID == authorID && doc.WorkspaceID == workspaceID {
			out = append(out, s.copy(doc))
		}
	}
	return out
}

func (s *Service) get(id string) (*model.ApprovalDoc, error) {
	doc, ok := s.docs[id]
	if !ok {
		return nil, ErrNotFound
	}
	return doc, nil
}

func (s *Service) addEvent(docID, action, actorID, comment string, stepOrder *int) {
	s.history[docID] = append(s.history[docID], model.ApprovalEvent{
		DocID:      docID,
		ActorID:    actorID,
		Action:     action,
		Comment:    comment,
		StepOrder:  stepOrder,
		OccurredAt: time.Now(),
	})
}

func (s *Service) copy(doc *model.ApprovalDoc) *model.ApprovalDoc {
	steps := make([]model.ApprovalStep, len(doc.Steps))
	copy(steps, doc.Steps)
	cp := *doc
	cp.Steps = steps
	return &cp
}
