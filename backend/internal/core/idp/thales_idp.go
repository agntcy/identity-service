// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/agntcy/identity-service/internal/core/settings/types"
	"github.com/google/uuid"
)

type ThalesIdp struct {
	settings *types.ThalesIdpSettings
}

func DynamicClientRegistrationOIP(
	clientName string,
	clientID string,
	ClientSecret string,
	registrationURL string,
	username string,
	password string,
	issuer string,
) (*ClientCredentials, error) {

	data := map[string]interface{}{
		"name":          clientName,
		"client_id":     clientID,
		"client_secret": ClientSecret,
		"grant_types": []string{
			"client_credentials",
		},
		"access_token_format":     "JWT",
		"access_token_expires_in": 3600,
		"default_scopes": []string{
			"profile",
			"email",
			"openid",
		},
		"open_id_connect": map[string]interface{}{
			"enabled":                 true,
			"expiration_time_seconds": 3600,
		},
	}
	reqJSON, _ := json.MarshalIndent(data, "", "  ")

	reqBody := bytes.NewBuffer(reqJSON)

	// TODO: implement your logic here
	req, err := http.NewRequest("POST", registrationURL, reqBody)
	if err != nil {
		fmt.Print("Failed to create client")
	}

	req.Header.Set("Content-Type", "application/json")

	auth := username + ":" + password
	basicAuth := "Basic " + base64.StdEncoding.EncodeToString([]byte(auth))
	req.Header.Set("Authorization", basicAuth)

	client := &http.Client{}
	resp, err := client.Do(req)
	fmt.Println("Response", resp)
	if err != nil {

		fmt.Print("Failed to to create client")
		return nil, nil
	} else {
		return &ClientCredentials{
			ClientID:     clientID,
			ClientSecret: ClientSecret,
			Issuer:       issuer,
		}, nil
	}

}

// CreateClientCredentialsPair implements Idp.
func (t *ThalesIdp) CreateClientCredentialsPair(ctx context.Context) (*ClientCredentials, error) {

	clientID := "idplclient" + uuid.NewString()
	clientSecret := uuid.NewString()
	return DynamicClientRegistrationOIP("Test Service", clientID, clientSecret, t.settings.RegistrationUrl, t.settings.SecretID, t.settings.SecretKeyValue, t.settings.IssuerUrl)

}

// DeleteClientCredentialsPair implements Idp.
func (t *ThalesIdp) DeleteClientCredentialsPair(ctx context.Context, clientCredentials *ClientCredentials) error {
	return nil

}

// TestSettings implements Idp.
func (t *ThalesIdp) TestSettings(ctx context.Context) error {

	return nil

}

func NewThalesIdp(settings *types.ThalesIdpSettings) Idp {
	return &ThalesIdp{settings: settings}
}
