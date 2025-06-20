package idp

type CredentialStore interface {
	Load() (*ClientCredentials, error)
	Store(cred *ClientCredentials) error
}

type VaultCredentialStore struct{}

func NewCredentialStore() CredentialStore {
	return &VaultCredentialStore{}
}

func (v *VaultCredentialStore) Load() (*ClientCredentials, error) {
	panic("unimplemented")
}

func (v *VaultCredentialStore) Store(cred *ClientCredentials) error {
	panic("unimplemented")
}
