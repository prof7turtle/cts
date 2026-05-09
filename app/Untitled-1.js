{
  "Client": "COGITATE",
  "Hooks": {
    "Pre": [
      {
        "RequestName": "/New/Request 1",
        "NeedCascading": true,
        "StaticParams": {},
        "Actions": [
          {
            "FunctionName": "GenerateQuoteNumber",
            "ModuleName": "@cogitate/core-pos-components",
            "CallFunction": true,
            "isEndpoint": false,
            "Condition": "",
            "Path": ""
          },
          {
            "FunctionName": "summaryOOS",
            "ModuleName": "@cogitate/core-pos-components",
            "CallFunction": true,
            "isEndpoint": false,
            "Condition": "Transaction.Type = 'Application'",
            "Path": ""
          },
          {
            "FunctionName": "ReinstatementUtilities",
            "ModuleName": "@cogitate/core-pos-components",
            "CallFunction": true,
            "isEndpoint": false,
            "Condition": "not(Transaction.Type = 'Application')",
            "Path": ""
          },
          {
            "FunctionName": "EvaluateCondition",
            "ModuleName": "@cogitate/core-pos-components",
            "CallFunction": true,
            "isEndpoint": false,
            "Condition": "Transaction.Type = 'Application'",
            "Path": ""
          }
        ]
      },
      {
        "RequestName": "/New/2",
        "NeedCascading": true,
        "StaticParams": {},
        "Actions": [
          {
            "FunctionName": "getGeoCodeAddressHook",
            "ModuleName": "@cogitate/core-pos-components",
            "CallFunction": true,
            "isEndpoint": false,
            "Condition": "",
            "Path": ""
          }
        ]
      }
    ],
    "Post": [
      {
        "RequestName": "/New/Request 1",
        "NeedCascading": true,
        "StaticParams": {},
        "Actions": [
          {
            "FunctionName": "copyDocuments",
            "ModuleName": "@cogitate/core-pos-components",
            "CallFunction": true,
            "isEndpoint": false,
            "Condition": "",
            "Path": ""
          }
        ]
      },
      {
        "RequestName": "/New/2",
        "NeedCascading": true,
        "StaticParams": {},
        "Actions": [
          {
            "FunctionName": "invokeAdaptiveAPI",
            "ModuleName": "@cogitate/core-pos-components",
            "CallFunction": true,
            "isEndpoint": true,
            "Condition": "",
            "Path": ""
          }
        ]
      }
    ]
  }
}