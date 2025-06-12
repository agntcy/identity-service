// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package joseutil

import (
	"crypto/rsa"
	"encoding/base64"
	"errors"
	"math/big"
	"strings"

	"github.com/agntcy/identity-saas/internal/core/id/types"
)

// ValidatePubKey validates the public key fields of the JWK according to its algorithm.
func ValidatePubKey(j *types.Jwk) error {
	if j == nil {
		return errors.New("jwk is nil")
	}

	switch strings.ToUpper(j.KTY) {
	case KeyTypeRSA:
		if j.D != "" || j.P != "" || j.Q != "" || j.DP != "" || j.DQ != "" || j.QI != "" {
			return errors.New("private key fields must not be present in RSA public key")
		}

		return validateRSAPubKey(j)
	default:
		return errors.New("unsupported key type for public key validation")
	}
}

// ValidatePrivKey validates the private key fields of the JWK according to its algorithm.
func ValidatePrivKey(j *types.Jwk) error {
	if j == nil {
		return errors.New("jwk is nil")
	}

	switch strings.ToUpper(j.KTY) {
	case KeyTypeRSA:
		return validateRSAPrivKey(j)
	default:
		return errors.New("unsupported key type for private key validation")
	}
}

// --- RSA Validation ---

func validateRSAPubKey(j *types.Jwk) error {
	if j.N == "" || j.E == "" {
		return errors.New("missing modulus (n) or exponent (e) for RSA public key")
	}

	n, err := base64.RawURLEncoding.DecodeString(j.N)
	if err != nil {
		return errors.New("invalid base64url encoding for modulus (n)")
	}

	e, err := base64.RawURLEncoding.DecodeString(j.E)
	if err != nil {
		return errors.New("invalid base64url encoding for exponent (e)")
	}

	if new(big.Int).SetBytes(n).Cmp(big.NewInt(0)) <= 0 {
		return errors.New("modulus (n) must be positive")
	}

	if new(big.Int).SetBytes(e).Cmp(big.NewInt(0)) <= 0 {
		return errors.New("exponent (e) must be positive")
	}

	return nil
}

func validateRSAPrivKey(j *types.Jwk) error {
	// Check required fields
	if j.N == "" || j.E == "" || j.D == "" || j.P == "" || j.Q == "" || j.DP == "" || j.DQ == "" ||
		j.QI == "" {
		return errors.New("missing one or more required RSA private key fields")
	}
	// Validate base64url encoding
	fields := []struct {
		name  string
		value string
	}{
		{
			"n",
			j.N,
		}, {"e", j.E}, {"d", j.D}, {"p", j.P}, {"q", j.Q}, {"dp", j.DP}, {"dq", j.DQ}, {"qi", j.QI},
	}
	for _, f := range fields {
		if _, err := base64.RawURLEncoding.DecodeString(f.value); err != nil {
			return errors.New("invalid base64url encoding for field: " + f.name)
		}
	}
	// Optionally, try to construct an rsa.PrivateKey (sanity check)
	nBytes, _ := base64.RawURLEncoding.DecodeString(j.N)
	eBytes, _ := base64.RawURLEncoding.DecodeString(j.E)
	dBytes, _ := base64.RawURLEncoding.DecodeString(j.D)
	pBytes, _ := base64.RawURLEncoding.DecodeString(j.P)
	qBytes, _ := base64.RawURLEncoding.DecodeString(j.Q)
	dpBytes, _ := base64.RawURLEncoding.DecodeString(j.DP)
	dqBytes, _ := base64.RawURLEncoding.DecodeString(j.DQ)
	qiBytes, _ := base64.RawURLEncoding.DecodeString(j.QI)

	n := new(big.Int).SetBytes(nBytes)
	e := int(new(big.Int).SetBytes(eBytes).Int64())
	d := new(big.Int).SetBytes(dBytes)
	p := new(big.Int).SetBytes(pBytes)
	q := new(big.Int).SetBytes(qBytes)
	dp := new(big.Int).SetBytes(dpBytes)
	dq := new(big.Int).SetBytes(dqBytes)
	qi := new(big.Int).SetBytes(qiBytes)

	priv := &rsa.PrivateKey{
		PublicKey: rsa.PublicKey{
			N: n,
			E: e,
		},
		D:      d,
		Primes: []*big.Int{p, q},
		Precomputed: rsa.PrecomputedValues{
			Dp:   dp,
			Dq:   dq,
			Qinv: qi,
		},
	}
	if err := priv.Validate(); err != nil {
		return errors.New("invalid RSA private key: " + err.Error())
	}

	return nil
}
