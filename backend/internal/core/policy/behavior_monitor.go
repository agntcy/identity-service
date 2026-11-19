package policy

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"
)

type BehaviorProfile struct {
	ExpectedSemanticDomain string   `json:"expected_semantic_domain"`
	AllowedTools           []string `json:"allowed_tools"`
	RemediationPolicy      string   `json:"remediation_policy"`
}

type LLMTelemetryChunk struct {
	AgentDID      string   `json:"agent_did"`
	PromptText    string   `json:"prompt_text"`
	ToolCalls     []string `json:"tool_calls"`
	CompletionRaw string   `json:"completion_raw"`
}

// ChannelGrantEnvelope complies with agntcy/slim#2229 (SLIM-CHANNEL-GRANT/1)
type ChannelGrantEnvelope struct {
	DomainPrefix string `json:"domain_prefix"` // "SLIM-CHANNEL-GRANT/1"
	ChannelName  string `json:"channel_name"`
	OwnerDIDKey  string `json:"owner_did_key"`
	NotAfter     int64  `json:"not_after"`
	Nonce        string `json:"nonce"`
	Signature    []byte `json:"signature"`
}

type ChannelEvictor interface {
	DeleteParticipant(ctx context.Context, grant ChannelGrantEnvelope, participantDID, reason string) error
}

type GrantSigner interface {
	SignGrant(channelName string, notAfter int64, nonce string) (ChannelGrantEnvelope, error)
}

type AuthoritativeMonitor struct {
	DefaultChannelID string
	Evictor          ChannelEvictor
	Signer           GrantSigner
}

func (m *AuthoritativeMonitor) EvaluateTelemetry(ctx context.Context, profile BehaviorProfile, chunk LLMTelemetryChunk) (bool, error) {
	// 1. Structural Drift: Validate LLM-generated tool_calls against OASF allowed_tools
	for _, invokedTool := range chunk.ToolCalls {
		if !contains(profile.AllowedTools, invokedTool) {
			reason := fmt.Sprintf("Structural Drift: unauthorized tool [%s]; allowed: %v", invokedTool, profile.AllowedTools)
			return false, m.triggerRemediation(ctx, chunk.AgentDID, reason)
		}
	}

	// 2. Semantic Drift: Inspect prompt & completion streams for context hijacking
	combinedText := strings.ToLower(chunk.PromptText + " " + chunk.CompletionRaw)
	if strings.Contains(combinedText, "ignore system prompt") || strings.Contains(combinedText, "sudo") {
		reason := fmt.Sprintf("Semantic Drift: intent hijack detected outside domain [%s]", profile.ExpectedSemanticDomain)
		return false, m.triggerRemediation(ctx, chunk.AgentDID, reason)
	}

	return true, nil
}

func (m *AuthoritativeMonitor) triggerRemediation(ctx context.Context, agentDID, reason string) error {
	if m.Evictor == nil || m.Signer == nil {
		return fmt.Errorf("channel evictor or grant signer not configured for agent %s", agentDID)
	}

	nonceBytes := make([]byte, 16)
	if _, err := rand.Read(nonceBytes); err != nil {
		return fmt.Errorf("failed to generate grant nonce: %w", err)
	}

	grant, err := m.Signer.SignGrant(
		m.DefaultChannelID,
		time.Now().Add(60*time.Second).Unix(),
		hex.EncodeToString(nonceBytes),
	)
	if err != nil {
		return fmt.Errorf("failed to sign SLIM-CHANNEL-GRANT/1 envelope: %w", err)
	}

	return m.Evictor.DeleteParticipant(ctx, grant, agentDID, reason)
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
