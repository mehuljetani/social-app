import {memo, useCallback, useMemo} from 'react'
import * as ExpoClipboard from 'expo-clipboard'
import {AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {makeProfileLink} from '#/lib/routes/links'
import {NavigationProp} from '#/lib/routes/types'
import {shareText, shareUrl} from '#/lib/sharing'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useDevModeEnabled} from '#/state/preferences/dev-mode'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {useDialogControl} from '#/components/Dialog'
import {SendViaChatDialog} from '#/components/dms/dialogs/ShareViaChatDialog'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {PaperPlane_Stroke2_Corner0_Rounded as Send} from '#/components/icons/PaperPlane'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as ArrowOutOfBoxIcon} from '../icons/ArrowOutOfBox'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '../icons/ChainLink'
import {ShareMenuItemsProps} from './ShareMenuItems.types'

let ShareMenuItems = ({
  post,
  onShare: onShareProp,
}: ShareMenuItemsProps): React.ReactNode => {
  const {hasSession, currentAccount} = useSession()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const pwiWarningShareControl = useDialogControl()
  const pwiWarningCopyControl = useDialogControl()
  const sendViaChatControl = useDialogControl()
  const [devModeEnabled] = useDevModeEnabled()

  const postUri = post.uri
  const postAuthor = useProfileShadow(post.author)

  const href = useMemo(() => {
    const urip = new AtUri(postUri)
    return makeProfileLink(postAuthor, 'post', urip.rkey)
  }, [postUri, postAuthor])

  const hideInPWI = useMemo(() => {
    return !!postAuthor.labels?.find(
      label => label.val === '!no-unauthenticated',
    )
  }, [postAuthor])

  const showLoggedOutWarning =
    postAuthor.did !== currentAccount?.did && hideInPWI

  const onSharePost = useCallback(() => {
    const url = toShareUrl(href)
    shareUrl(url)
    onShareProp()
  }, [href, onShareProp])

  const onCopyLink = useCallback(() => {
    const url = toShareUrl(href)
    ExpoClipboard.setUrlAsync(url).then(() =>
      Toast.show(_(msg`Copied to clipboard`), 'clipboard-check'),
    )
    onShareProp()
  }, [href, onShareProp, _])

  const onSelectChatToShareTo = useCallback(
    (conversation: string) => {
      navigation.navigate('MessagesConversation', {
        conversation,
        embed: postUri,
      })
    },
    [navigation, postUri],
  )

  const onShareATURI = useCallback(() => {
    shareText(postUri)
  }, [postUri])

  const onShareAuthorDID = useCallback(() => {
    shareText(postAuthor.did)
  }, [postAuthor.did])

  return (
    <>
      <Menu.Outer>
        <Menu.Group>
          <Menu.Item
            testID="postDropdownShareBtn"
            label={_(msg`Share via...`)}
            onPress={() => {
              if (showLoggedOutWarning) {
                pwiWarningShareControl.open()
              } else {
                onSharePost()
              }
            }}>
            <Menu.ItemText>
              <Trans>Share via...</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={ArrowOutOfBoxIcon} position="right" />
          </Menu.Item>

          <Menu.Item
            testID="postDropdownShareBtn"
            label={_(msg`Copy link to post`)}
            onPress={() => {
              if (showLoggedOutWarning) {
                pwiWarningCopyControl.open()
              } else {
                onCopyLink()
              }
            }}>
            <Menu.ItemText>
              <Trans>Copy link to post</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={ChainLinkIcon} position="right" />
          </Menu.Item>

          {hasSession && (
            <Menu.Item
              testID="postDropdownSendViaDMBtn"
              label={_(msg`Send via direct message`)}
              onPress={() => sendViaChatControl.open()}>
              <Menu.ItemText>
                <Trans>Send via direct message</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={Send} position="right" />
            </Menu.Item>
          )}
        </Menu.Group>

        {devModeEnabled && (
          <>
            <Menu.Divider />
            <Menu.Group>
              <Menu.Item
                testID="postAtUriShareBtn"
                label={_(msg`Copy post at:// URI`)}
                onPress={onShareATURI}>
                <Menu.ItemText>
                  <Trans>Share post at:// URI</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={ClipboardIcon} position="right" />
              </Menu.Item>
              <Menu.Item
                testID="postAuthorDIDShareBtn"
                label={_(msg`Copy author DID`)}
                onPress={onShareAuthorDID}>
                <Menu.ItemText>
                  <Trans>Share author DID</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={ClipboardIcon} position="right" />
              </Menu.Item>
            </Menu.Group>
          </>
        )}
      </Menu.Outer>

      <Prompt.Basic
        control={pwiWarningShareControl}
        title={_(msg`Note about sharing`)}
        description={_(
          msg`This post is only visible to logged-in users. It won't be visible to people who aren't signed in.`,
        )}
        onConfirm={onSharePost}
        confirmButtonCta={_(msg`Share anyway`)}
      />

      <Prompt.Basic
        control={pwiWarningCopyControl}
        title={_(msg`Note about sharing`)}
        description={_(
          msg`This post is only visible to logged-in users. It won't be visible to people who aren't signed in.`,
        )}
        onConfirm={onCopyLink}
        confirmButtonCta={_(msg`Copy anyway`)}
      />

      <SendViaChatDialog
        control={sendViaChatControl}
        onSelectChat={onSelectChatToShareTo}
      />
    </>
  )
}
ShareMenuItems = memo(ShareMenuItems)
export {ShareMenuItems}
