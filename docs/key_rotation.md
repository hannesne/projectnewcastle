# Key Rotation Pattern with Terraform
In our scenario, we keep all sensitive information in Key Vault like the host key of two function apps, PaitentTests API and Audit API. With Key Vault, the communication between API Management and Function APPs look like following.
- Patient API in API Management first retrieves the PatientTests API host key from Key Vault, caches it and then puts it into HTTP header when calling PatientTests API function app.
- PatientTests API function app also retrieves the Audit API host key from Key Vault and puts it into HTTP header when calling Audit API function app.

It looks all good, but we can keep improving the system security by some approaches. One of them is key rotation. You can rotate the key periodically to make the system more secure or you can also rotate the key on demand in case of key leakage. So in this document, we will go through the key rotation pattern with Terraform which we used in our scenario.

## Key Rotation for Audit API Function App
Let's say we want to rotate the host key of Audit API function app. We can first think about what we need to change in order to keep the system functional. There are three places we need to change.
1. The host key itself in Audit API function app
2. The secret in Key Vault which store the host key
3. The Key Vault reference in applicaiton settings of PatientTests API function app, since it needs to refer the latest secret version instead of the old one.

Actually you can finish all above tasks manually in Azure Portal if you have permissions to do that or you can use Azure CLI to do the same with following commands.
1. Rotate the host key: [Web Apps - Create Or Update Host Secret](https://docs.microsoft.com/en-us/rest/api/appservice/webapps/createorupdatehostsecret)
2. Update the secret: [az keyvault secret set](https://docs.microsoft.com/en-us/cli/azure/keyvault/secret?view=azure-cli-latest#az-keyvault-secret-set)
3. Update the key vault reference in app settings: [az functionapp config appsettings set](https://docs.microsoft.com/en-us/cli/azure/functionapp/config/appsettings?view=azure-cli-latest#az-functionapp-config-appsettings-set)

However, we don't want to do above tasks manually. Because we are using Terraform as IaC, we should keep IaC as much as possible in Terraform. It's a bad practice if you mix Terraform and manual resource provisioning. So our solution is described below.

### Rotate the host key
When we are writing this document, Terraform Azure Provider does not support access keys in Function App natively, so we have to use [Web Apps - Create Or Update Host Secret](https://docs.microsoft.com/en-us/rest/api/appservice/webapps/createorupdatehostsecret) REST API to rotate the host key. But it's OK, since Terraform does not maintain the host key anyway. The Azure CLI command looks like following.

```
az rest --method put --uri /subscriptions/<YOUR_SUBSCRIPTION>/resourceGroups/newcastle/providers/Microsoft.Web/sites/newcastle-fa-audit-api-dev/host/default/functionkeys/default?api-version=2019-08-01 --body <YOUR_PAYLOAD>
```

`<YOUR_PAYLOAD>` is a JSON object like following.
```
{
    properties: {
        name: <KEY_NAME>
        value: <KEY_VALUE>
    }
}
```

### Update the secret
As we mentioned before, Terraform does not maintain the host key of function app, so we used a workaround to retrieve the host key with `external` provider. Terraform will check if the secret needs to be updated based on the retrieved host key. The complete code can be found in the `/env` folder. We just highlight some code snippets here.

```
data "external" "fa_audit_api_host_key" {
  program = ["bash", "-c", "az rest --method post --uri /subscriptions/${data.azurerm_client_config.current.subscription_id}/resourceGroups/${var.project_name}/providers/Microsoft.Web/sites/${module.fa_audit_api.name}/host/default/listKeys?api-version=2019-08-01 --query functionKeys"]
}

resource "azurerm_key_vault_secret" "fa_audit_api_host_key" {
  name         = "fa-audit-api-host-key"
  value        = data.external.fa_audit_api_host_key.result.default
  key_vault_id = azurerm_key_vault.kv.id
}
```

### Update the key vault reference in app settings
When the secret is updated, actually a new version will be created. That's why we need to create a `data` secret to refer the `resource` secret to get the latest `id` and the key vault reference in app settings should refer `data` secret instead of `resource` secret as well.

```
data "azurerm_key_vault_secret" "fa_audit_api_host_key" {
  name         = azurerm_key_vault_secret.fa_audit_api_host_key.name
  key_vault_id = azurerm_key_vault_secret.fa_audit_api_host_key.key_vault_id
}

module "fa_patient_api" {
  ...
  extra_app_settings = {
    ...
    audit_auth_key          = "@Microsoft.KeyVault(SecretUri=${data.azurerm_key_vault_secret.fa_audit_api_host_key.id})"
  }
}
```

## Key Rotation for PatientTests API Function App
Now let's have a look at key rotation for PatientTests API function app. There are also three places we need to change.
1. The host key itself in PatientTests API function app
2. The secret in Key Vault which store the host key
3. The Key Vault reference in caching policy of Patient API in API Management

Actually you can finish those tasks in Azure Portal or with Azure CLI like previous section, but we will keep using Terraform as mush as possible.

### Rotate the host key
Same as rotating the host key of Audit API function app. We just need to change the function app name.

```
az rest --method put --uri /subscriptions/<YOUR_SUBSCRIPTION>/resourceGroups/newcastle/providers/Microsoft.Web/sites/newcastle-fa-patient-api-dev/host/default/functionkeys/default?api-version=2019-08-01 --body <YOUR_PAYLOAD>
```

### Update the secret
Same as updating the secret for the host key of Audit API function app.

```
data "external" "fa_patient_api_host_key" {
  program = ["bash", "-c", "az rest --method post --uri /subscriptions/${data.azurerm_client_config.current.subscription_id}/resourceGroups/${var.project_name}/providers/Microsoft.Web/sites/${module.fa_patient_api.name}/host/default/listKeys?api-version=2019-08-01 --query functionKeys"]
}

resource "azurerm_key_vault_secret" "fa_patient_api_host_key" {
  name         = "fa-patient-api-host-key"
  value        = data.external.fa_patient_api_host_key.result.default
  key_vault_id = azurerm_key_vault.kv.id
}
```

### Update the key vault reference in caching policy
If a secret in Key Vault is changed, a new `id` will be generated for the secret. Since Patient API caching policy refers the key vault secret with the latest `id`, Terraform will update the reference in caching policy if the secret is updated with a new `id`.

```
data "azurerm_key_vault_secret" "fa_patient_api_host_key" {
  name         = azurerm_key_vault_secret.fa_patient_api_host_key.name
  key_vault_id = azurerm_key_vault_secret.fa_patient_api_host_key.key_vault_id
}

resource "azurerm_api_management_api_policy" "patient_policy" {
  ...
  xml_content = <<XML
<policies>
  <inbound>
    ...
    <send-request ignore-error="false" timeout="20" response-variable-name="coderesponse" mode="new">
      <set-url>${data.azurerm_key_vault_secret.fa_patient_api_host_key.id}?api-version=7.0</set-url>
      <set-method>GET</set-method>
      <authentication-managed-identity resource="https://vault.azure.net" />
    </send-request>
    ...
  </inbound>
</policies>
XML
}
```

Since we cached the host key in API Management, the retired key may still exist in the cache, we need to find a way to remove it from cache or update it to the latest host key. We are using internal cache in API Management, so it's not easy to remove the cache and there is no REST API to do that. We used a workaround to update the cached key if PatientTests API returns `401 Unauthorized` error.

```
resource "azurerm_api_management_api_policy" "patient_policy" {
  ...
  xml_content = <<XML
<policies>
  <outbound>
    <choose>
      <when condition="@(context.Response.StatusCode == 401)">
        <send-request ignore-error="false" timeout="20" response-variable-name="coderesponse" mode="new">
          <set-url>${data.azurerm_key_vault_secret.fa_patient_api_host_key.id}?api-version=7.0</set-url>
          <set-method>GET</set-method>
          <authentication-managed-identity resource="https://vault.azure.net" />
        </send-request>
        <cache-store-value key="func-host-key" value="@((string)((IResponse)context.Variables["coderesponse"]).Body.As<JObject>()["value"])" duration="100000" />
      </when>
    </choose>
  </outbound>
</policies>
XML
}
```

## All in one to rotate host keys
Last but not least, how to rotate host keys? There are only two steps.
1. Use Azure CLI to update either host key or both host keys
2. Run `terraform apply` with your variables