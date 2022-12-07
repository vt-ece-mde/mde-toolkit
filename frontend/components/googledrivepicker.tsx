/**
 * DISCLAIMER
 * 
 * This entire file is a workaround for the NPM repository `react-google-drive-picker`.
 * https://www.npmjs.com/package/react-google-drive-picker
 * 
 * The problem is that the default behavior of the tool requires a Google Developer API key,
 * which is not technically required if a post-auth access token is present. Therefore, to bypass this,
 * a totally separate implementation is required which simply removes the call to set the
 * developer key.
 * 
 * Search for the tag "CHANGEME" to see which lines were changed.
 * 
 * This code was gleaned directly from the source repository and we in no way assume ownership
 * of the original design. 
 * 
 * For original code, see: https://github.com/Jose-cd/React-google-drive-picker/blob/master/src/index.tsx
 */


// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let google: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let window: any
import { useEffect, useState } from 'react'
import {
  authResult,
  defaultConfiguration,
  PickerConfiguration,
} from 'react-google-drive-picker/dist/typeDefs'
import useInjectScript from 'react-google-drive-picker/dist/useInjectScript'

// export declare type PickerConfiguration = PickerConfiguration & {
//     clientId?: string;
//     developerKey?: string;
// };
// export declare const newDefaultConfiguration: PickerConfiguration;
// export {};

export default function useDrivePicker(): [
  (config: PickerConfiguration) => boolean | undefined,
  authResult | undefined
] {
  const defaultScopes = ['https://www.googleapis.com/auth/drive.readonly']
  const [loaded, error] = useInjectScript('https://apis.google.com/js/api.js')
  const [loadedGsi, errorGsi] = useInjectScript(
    'https://accounts.google.com/gsi/client'
  )
  const [pickerApiLoaded, setpickerApiLoaded] = useState(false)
  const [openAfterAuth, setOpenAfterAuth] = useState(false)
  const [authWindowVisible, setAuthWindowVisible] = useState(false)
  const [config, setConfig] =
    useState<PickerConfiguration>(defaultConfiguration)
  const [authRes, setAuthRes] = useState<authResult>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let picker: any

  // get the apis from googleapis
  useEffect(() => {
    if (loaded && !error && loadedGsi && !errorGsi && !pickerApiLoaded) {
      loadApis()
    }
  }, [loaded, error, loadedGsi, errorGsi, pickerApiLoaded])

  // use effect to open picker after auth
  useEffect(() => {
    if (
      openAfterAuth &&
      config.token &&
      loaded &&
      !error &&
      loadedGsi &&
      !errorGsi &&
      pickerApiLoaded
    ) {
      createPicker(config)
      setOpenAfterAuth(false)
    }
  }, [
    openAfterAuth,
    config.token,
    loaded,
    error,
    loadedGsi,
    errorGsi,
    pickerApiLoaded,
  ])

  // open the picker
  const openPicker = (config: PickerConfiguration) => {
    // global scope given conf
    setConfig(config)

    // if we didnt get token generate token.
    if (!config.token) {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: (config.customScopes
          ? [...defaultScopes, ...config.customScopes]
          : defaultScopes
        ).join(' '),
        callback: (tokenResponse: authResult) => {
          setAuthRes(tokenResponse)
          createPicker({ ...config, token: tokenResponse.access_token })
        },
      })

      client.requestAccessToken()
    }

    // if we have token and everything is loaded open the picker
    if (config.token && loaded && !error && pickerApiLoaded) {
      return createPicker(config)
    }
  }

  // load the Drive picker api
  const loadApis = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.gapi.load('auth')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.gapi.load('picker', { callback: onPickerApiLoad })
  }

  const onPickerApiLoad = () => {
    setpickerApiLoaded(true)
  }

  const createPicker = ({
    token,
    appId = '',
    supportDrives = false,
    developerKey = '',
    viewId = 'DOCS',
    disabled,
    multiselect,
    showUploadView = false,
    showUploadFolders,
    setParentFolder = '',
    viewMimeTypes,
    customViews,
    locale = 'en',
    setIncludeFolders,
    setSelectFolderEnabled,
    disableDefaultView = false,
    callbackFunction,
  }: PickerConfiguration) => {
    if (disabled) return false

    const view = new google.picker.DocsView(google.picker.ViewId[viewId])
    if (viewMimeTypes) view.setMimeTypes(viewMimeTypes)
    if (setIncludeFolders) view.setSelectFolderEnabled(true)
    if (setSelectFolderEnabled) view.setSelectFolderEnabled(true)

    const uploadView = new google.picker.DocsUploadView()
    if (viewMimeTypes) uploadView.setMimeTypes(viewMimeTypes)
    if (showUploadFolders) uploadView.setIncludeFolders(true)
    if (setParentFolder) uploadView.setParent(setParentFolder)

    picker = new google.picker.PickerBuilder()
      .setAppId(appId)
      .setOAuthToken(token)
    //   .setDeveloperKey(developerKey) // CHANGEME: This is not required if a token is provided.
      .setLocale(locale)
      .setCallback(callbackFunction)

    if (!disableDefaultView) {
      picker.addView(view)
    }

    if (customViews) {
      customViews.map((view) => picker.addView(view))
    }

    if (multiselect) {
      picker.enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    }

    if (showUploadView) picker.addView(uploadView)

    // CHANGEME: Adds new "Shared drives" folder view.
    const folderView = new google.picker.DocsView(google.picker.ViewId[viewId])
        .setIncludeFolders(true)
        .setEnableDrives(true)
        .setSelectFolderEnabled(true);
    if (setParentFolder) folderView.setParent(setParentFolder);
    picker.addView(folderView);

    if (supportDrives) {
      picker.enableFeature(google.picker.Feature.SUPPORT_DRIVES)
    }

    picker.build().setVisible(true)

    return true
  }

  return [openPicker, authRes]
}