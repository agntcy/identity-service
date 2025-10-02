// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
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
