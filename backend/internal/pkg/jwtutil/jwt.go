package jwtutil

import (
	"github.com/lestrrat-go/jwx/v3/jwt"
)

func GetID(
	jwtString string,
) (string, bool) {
	jwtToken, err := jwt.Parse(
		[]byte(jwtString),
		jwt.WithVerify(false),
		jwt.WithValidate(false),
	)
	if err != nil {
		return "", false
	}

	return jwtToken.JwtID()
}
