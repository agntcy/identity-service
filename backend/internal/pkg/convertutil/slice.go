// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package convertutil

func ConvertSlice[T any, S any](list []T, convert func(T) *S) []*S {
	if convert == nil {
		return nil
	}

	var responseList = make([]*S, 0)
	for _, obj := range list {
		responseList = append(responseList, convert(obj))
	}

	return responseList
}
