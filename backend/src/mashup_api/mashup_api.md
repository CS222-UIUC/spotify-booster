# Mashup API Documentation


## Important: Authentication Is Required

Ensure requests are sent with cookie: `"spotify_access_token"` set to valid spotify_api access_token

## Create Mashup
Creates a new mashup
```http
POST: /mashupapi/createMashup?name=mashup_name
```
| Parameter | Type | Description |
| :--- | :--- | :--- |
| name | `string` | Name of the mashup you're trying to create |

### Response
```js
{
  "mashup_id": string,
  "error_message": string
}
```
`"mashup_id"` is the unique mashup id of the mashup that was just created

`"error_message"` contains an error message if there was an error

### Status Codes
| Code | Description |
| :--- | :--- |
| 200 | OK |
| 400 | BAD REQUEST (name was probably invalid) |
| 401 | UNAUTHORIZED (`"spotify_access_token"` cookie probably was not set correctly) |
| 403 | FORBIDDEN (user probably does not have access to view/edit mashup) |
| 500 | INTERNAL SERVER ERROR |


## Generate Mashup
Generates a tracks for mashup
```http
POST: /mashupapi/generateMashup?mashup_id=45a87c57-aeaf-416a-a7af-7787e9a2a4f4&start_track_id=7mo7AdBOTne5yjuHyteVvy&source_id=00TQ8IydoicWjAjVN0keHr&source_type=0
```
| Parameter | Type | Description |
| :--- | :--- | :--- |
| mashup_id | `string` | Mashup id of mashup to save generated mashup to |
| start_track_id | `string` | Track id of song mashup should start with |
| source_id | `string` | Spotify id of track source to use to generate mashup (Album or Playlist) |
| source_type | `integer` | Type of source to use (0 = Album, 1 = Playlist) |

### Response
```js
{
  "error_message": string
}
```

`"error_message"` contains an error message if there was an error

### Status Codes
| Code | Description |
| :--- | :--- |
| 200 | OK |
| 400 | BAD REQUEST (name was probably invalid) |
| 401 | UNAUTHORIZED (`"spotify_access_token"` cookie probably was not set correctly) |
| 403 | FORBIDDEN (user probably does not have access to view/edit mashup) |
| 500 | INTERNAL SERVER ERROR |


## Get Users Mashups
Gets users mashups
```http
GET: /mashupapi/getUserMashups
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| none | | |

### Response
```js
type MashupInfo = {
  mashup_id: string,
  name: string,
}

{
  "mashups": Array<MashupInfo>
  "error_message": string
}
```
`"mashups"` is the array containing the search restuls

`"MashupInfo.mashup_id"` is the unique mashup_id of the mashup

`"MashupInfo.name"` is the user set name of the mashup

`"error_message"` contains an error message if there was an error

### Status Codes
| Code | Description |
| :--- | :--- |
| 200 | OK |
| 400 | BAD REQUEST (mashup_id was probably wrong) |
| 401 | UNAUTHORIZED (`"spotify_access_token"` cookie probably was not set correctly) |
| 403 | FORBIDDEN (user probably does not have access to view/edit mashup) |
| 500 | INTERNAL SERVER ERROR |

## Get Mashup Name
Fetches the name of a given mashup
```http
Get: /mashupapi/getMashupName?mashup_id=45a87c57-aeaf-416a-a7af-7787e9a2a4f4
```
| Parameter | Type | Description |
| :--- | :--- | :--- |
| mashup_id | `string` | Unique mashup_id of the mashup you're trying to fetch |

### Response
```js
{
  "name": string
  "error_message": string
}
```
`"name"` is the name of the mashup

`"error_message"` contains an error message if there was an error

### Status Codes
| Code | Description |
| :--- | :--- |
| 200 | OK |
| 400 | BAD REQUEST (mashup_id was probably wrong) |
| 401 | UNAUTHORIZED (`"spotify_access_token"` cookie probably was not set correctly) |
| 403 | FORBIDDEN (user probably does not have access to view/edit mashup) |
| 500 | INTERNAL SERVER ERROR |

## Search Users Mashups
Searches a users mashups to find mashups with names beginning the same way as the search string
```http
Get: /mashupapi/searchUserMashups?search_string=name&limit=3
```
| Parameter | Type | Description |
| :--- | :--- | :--- |
| search_string | `string` | Search string to search with |
| limit | `integer` | (Optional) number of results to limit search to |

### Response
```js
type MashupInfo = {
  mashup_id: string,
  name: string,
}

{
  "results": Array<MashupInfo>
  "error_message": string
}
```
`"results"` is the array containing the search restuls

`"MashupInfo.mashup_id"` is the unique mashup_id of the mashup

`"MashupInfo.name"` is the user set name of the mashup

`"error_message"` contains an error message if there was an error

### Status Codes
| Code | Description |
| :--- | :--- |
| 200 | OK |
| 400 | BAD REQUEST (mashup_id was probably wrong) |
| 401 | UNAUTHORIZED (`"spotify_access_token"` cookie probably was not set correctly) |
| 403 | FORBIDDEN (user probably does not have access to view/edit mashup) |
| 500 | INTERNAL SERVER ERROR |



## Set Mashup Name
Updates the name of a given mashup
```http
PUT: /mashupapi/setMashupName?name=new_name&mashup_id=45a87c57-aeaf-416a-a7af-7787e9a2a4f4
```
| Parameter | Type | Description |
| :--- | :--- | :--- |
| mashup_id | `string` | Unique mashup_id of the mashup you're trying to fetch |

### Response
```js
{
  "error_message": string
}
```
`"error_message"` contains an error message if there was an error

### Status Codes
| Code | Description |
| :--- | :--- |
| 200 | OK |
| 400 | BAD REQUEST (probably mashup_id was wrong or name was invalid) |
| 401 | UNAUTHORIZED (`"spotify_access_token"` cookie probably was not set correctly) |
| 403 | FORBIDDEN (user probably does not have access to view/edit mashup) |
| 500 | INTERNAL SERVER ERROR |

## Delete Mashup
Deletes the given mashup
```http
DELETE: /mashupapi/deleteMashup?mashup_id=45a87c57-aeaf-416a-a7af-7787e9a2a4f4
```
| Parameter | Type | Description |
| :--- | :--- | :--- |
| mashup_id | `string` | Unique mashup_id of the mashup you're trying to delete |
### Response
```js
{
  "error_message": string
}
```
`"error_message"` contains an error message if there was an error

### Status Codes
| Code | Description |
| :--- | :--- |
| 200 | OK |
| 400 | BAD REQUEST (mashup_id was probably invalid) |
| 401 | UNAUTHORIZED (`"spotify_access_token"` cookie probably was not set correctly) |
| 403 | FORBIDDEN (user probably does not have access to view/edit mashup) |
| 500 | INTERNAL SERVER ERROR |

## Get Mashup Tracks
```http
Get: /mashupapi/getMashupTracks?mashup_id=45a87c57-aeaf-416a-a7af-7787e9a2a4f4
```
| Parameter | Type | Description |
| :--- | :--- | :--- |
| mashup_id | `string` | Unique mashup_id of the mashup you're trying to fetch |

### Response
```js
type TrackInfo = {
  track_id: string,
  start_ms: number,
  end_ms: number,
};

{
  "tracks": Array<TrackInfo>,
  "error_message": string
}
```
`"tracks"` is an array of TrackInfo objects 

`"TrackInfo.track_id"` is the Spotify track id of song

`"TrackInfo.start_ms"` is the start time of song in milliseconds

`"TrackInfo.end_ms"` is the end time of song in milliseconds

`"error_message"` contains an error message if there was an error

### Status Codes
| Code | Description |
| :--- | :--- |
| 200 | OK |
| 400 | BAD REQUEST (mashup_id was probably wrong) |
| 401 | UNAUTHORIZED (`"spotify_access_token"` cookie probably was not set correctly) |
| 403 | FORBIDDEN (user probably does not have access to view/edit mashup) |
| 500 | INTERNAL SERVER ERROR |

## Add Track
Adds a new track in the given mashup
```http
PUT: /mashupapi/addTrack?track_id=6wmcrRId5aeo7hiEqHAtEO&mashup_id=45a87c57-aeaf-416a-a7af-7787e9a2a4f4&index=0
```
| Parameter | Type | Description |
| :--- | :--- | :--- |
| track_id | `string` | Spotify track_id of song |
| mashup_id | `string` | Unique mashup_id of the mashup to add to |
| index | `number` | Index of track in mashup |

### Response
```js
{
  "error_message": string
}
```
`"error_message"` contains an error message if there was an error

### Status Codes
| Code | Description |
| :--- | :--- |
| 200 | OK |
| 400 | BAD REQUEST (mashup_id was probably invalid) |
| 401 | UNAUTHORIZED (`"spotify_access_token"` cookie probably was not set correctly) |
| 403 | FORBIDDEN (user probably does not have access to view/edit mashup) |
| 500 | INTERNAL SERVER ERROR |

## Set Track Start MS
Sets start time of track
```http
PUT: /mashupapi/setStartMs?track_id=6wmcrRId5aeo7hiEqHAtEO&mashup_id=45a87c57-aeaf-416a-a7af-7787e9a2a4f4&start_ms=123
```
| Parameter | Type | Description |
| :--- | :--- | :--- |
| track_id | `string` | Spotify track_id of song |
| mashup_id | `string` | Unique mashup_id of the mashup to add to |
| start_ms | `integer` | Time in milliseconds of start of track (must be >= 0) |

### Response
```js
{
  "error_message": string
}
```
`"error_message"` contains an error message if there was an error

### Status Codes
| Code | Description |
| :--- | :--- |
| 200 | OK |
| 400 | BAD REQUEST (mashup_id was probably invalid) |
| 401 | UNAUTHORIZED (`"spotify_access_token"` cookie probably was not set correctly) |
| 403 | FORBIDDEN (user probably does not have access to view/edit mashup) |
| 500 | INTERNAL SERVER ERROR |


## Set Track End MS
Sets end time of track
```http
PUT: /mashupapi/setEndMs?track_id=6wmcrRId5aeo7hiEqHAtEO&mashup_id=45a87c57-aeaf-416a-a7af-7787e9a2a4f4&end_ms=123
```
| Parameter | Type | Description |
| :--- | :--- | :--- |
| track_id | `string` | Spotify track_id of song |
| mashup_id | `string` | Unique mashup_id of the mashup to add to |
| start_ms | `integer` | Time in milliseconds of end of track (must be >= -1 where -1 indicates end of track)|

### Response
```js
{
  "error_message": string
}
```
`"error_message"` contains an error message if there was an error

### Status Codes
| Code | Description |
| :--- | :--- |
| 200 | OK |
| 400 | BAD REQUEST (mashup_id was probably invalid) |
| 401 | UNAUTHORIZED (`"spotify_access_token"` cookie probably was not set correctly) |
| 403 | FORBIDDEN (user probably does not have access to view/edit mashup) |
| 500 | INTERNAL SERVER ERROR |

## Remove Track
Removes a given track in the given mashup
```http
DELETE: /mashupapi/removeTrack?track_id=6wmcrRId5aeo7hiEqHAtEO&mashup_id=45a87c57-aeaf-416a-a7af-7787e9a2a4f4
```
| Parameter | Type | Description |
| :--- | :--- | :--- |
| track_id | `string` | Spotify track_id of song |
| mashup_id | `string` | Unique mashup_id of the mashup to remove track from |

### Response
```js
{
  "error_message": string
}
```
`"error_message"` contains an error message if there was an error

### Status Codes
| Code | Description |
| :--- | :--- |
| 200 | OK |
| 400 | BAD REQUEST (mashup_id was probably invalid) |
| 401 | UNAUTHORIZED (`"spotify_access_token"` cookie probably was not set correctly) |
| 403 | FORBIDDEN (user probably does not have access to view/edit mashup) |
| 500 | INTERNAL SERVER ERROR |