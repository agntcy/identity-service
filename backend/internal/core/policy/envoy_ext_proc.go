package policy

import (
	"context"
	"encoding/json"
	"io"

	extprocv3 "://github.com"
)

type EnvoyStreamTapServer struct {
	extprocv3.UnimplementedExternalProcessorServer
	Monitor *AuthoritativeMonitor
}

func (s *EnvoyStreamTapServer) Process(stream extprocv3.ExternalProcessor_ProcessServer) error {
	var agentDID string

	for {
		req, err := stream.Recv()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}

		switch v := req.Request.(type) {
		case *extprocv3.ProcessingRequest_RequestHeaders:
			for _, h := range v.RequestHeaders.Headers.Headers {
				if h.Key == "x-agntcy-agent-did" {
					agentDID = string(h.RawValue)
				}
			}
			_ = stream.Send(&extprocv3.ProcessingResponse{
				Response: &extprocv3.ProcessingResponse_RequestHeaders{},
			})

		case *extprocv3.ProcessingRequest_ResponseBody:
			// Copy slice before goroutine to prevent buffer reuse race conditions
			bodyCopy := append([]byte(nil), v.ResponseBody.Body...)
			go s.inspectChunkAsync(context.Background(), agentDID, bodyCopy)

			_ = stream.Send(&extprocv3.ProcessingResponse{
				Response: &extprocv3.ProcessingResponse_ResponseBody{},
			})
		}
	}
}

func (s *EnvoyStreamTapServer) inspectChunkAsync(ctx context.Context, agentDID string, rawSSE []byte) {
	var payload map[string]any
	if err := json.Unmarshal(rawSSE, &payload); err != nil {
		return
	}
	// Resolve OASF behavior_profile for agentDID and call s.Monitor.EvaluateTelemetry(...)
}
