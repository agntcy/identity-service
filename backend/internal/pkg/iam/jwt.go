// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package iam

import (
	jwtverifier "github.com/okta/okta-jwt-verifier-golang"
)

type Claims map[string]interface{}

type JwtVerifier interface {
	VerifyAccessToken(jwt string) (Claims, error)
}

type oktaJwtVerifier struct {
	userJwtVerifier *jwtverifier.JwtVerifier
}

func NewOktaJwtVerifier(issuer, userCid string) JwtVerifier {
	// Init verifier for UI
	toValidateForUser := map[string]string{}

	// Add cid from UI
	toValidateForUser["aud"] = standaloneDefaultAud
	toValidateForUser["cid"] = userCid

	userJwtVerifierSetup := jwtverifier.JwtVerifier{
		Issuer:           issuer,
		ClaimsToValidate: toValidateForUser,
	}

	userJwtVerifier := userJwtVerifierSetup.New()

	return &oktaJwtVerifier{
		userJwtVerifier: userJwtVerifier,
	}
}

func (v *oktaJwtVerifier) VerifyAccessToken(jwt string) (Claims, error) {
	token, err := v.userJwtVerifier.VerifyAccessToken(jwt)
	if err != nil {
		return nil, err
	}

	return token.Claims, nil
}
