package identitycontext

type key string

func (k key) String() string {
	return string(k)
}

var TenantID = key("tenant-id")
var UserID = key("user-id")
var AuthType = key("auth-type")
var AppID = key("app-id")
