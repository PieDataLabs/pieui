import { useMemo } from 'react'
// @ts-ignore
import { UiConstructor } from '../Card/UIConstructor'
import { UIConfigType, PieEventEmitter, SetUiAjaxConfigurationType } from './types'
import { preloadMap, trackLazy } from '../../util/lazyPreload'

//Buttons
const AjaxButtonCard = trackLazy(preloadMap.AjaxButtonCard, 'AjaxButtonCard')
const RedirectButtonCard = trackLazy(preloadMap.RedirectButtonCard, 'RedirectButtonCard')
const SubmitButtonCard = trackLazy(preloadMap.SubmitButtonCard, 'SubmitButtonCard')
const ModalButtonCard = trackLazy(preloadMap.ModalButtonCard, 'ModalButtonCard')
const ClipboardButtonCard = trackLazy(preloadMap.ClipboardButtonCard, 'ClipboardButtonCard')

// Common
const EmptyCard = trackLazy(preloadMap.EmptyCard, 'EmptyCard')
const CompiledCard = trackLazy(preloadMap.CompiledCard, 'CompiledCard')
const URLBasedModalCard = trackLazy(preloadMap.URLBasedModalCard, 'URLBasedModalCard')
const AutoRedirectCard = trackLazy(preloadMap.AutoRedirectCard, 'AutoRedirectCard')
const PageConfigurationCard = trackLazy(preloadMap.PageConfigurationCard, 'PageConfigurationCard')
const ColoredTextCard = trackLazy(preloadMap.ColoredTextCard, 'ColoredTextCard')
const ProgressCard = trackLazy(preloadMap.ProgressCard, 'ProgressCard')
const CircularProgressCard = trackLazy(preloadMap.CircularProgressCard, 'CircularProgressCard')
const FileCard = trackLazy(preloadMap.FileCard, 'FileCard')
const TupleCard = trackLazy(preloadMap.TupleCard, 'TupleCard')
const ClipboardCard = trackLazy(preloadMap.ClipboardCard, 'ClipboardCard')
const HiddenCard = trackLazy(preloadMap.HiddenCard, 'HiddenCard')
const HiddenGeoCard = trackLazy(preloadMap.HiddenGeoCard, 'HiddenGeoCard')
const NavigationCard = trackLazy(preloadMap.NavigationCard, 'NavigationCard')
const MobileBottomNavigationCard = trackLazy(
    preloadMap.MobileBottomNavigationCard,
    'MobileBottomNavigationCard',
)
const SideNavigationCard = trackLazy(preloadMap.SideNavigationCard, 'SideNavigationCard')
const HTMLEmbedCard = trackLazy(preloadMap.HTMLEmbedCard, 'HTMLEmbedCard')
const ImageEmbedCard = trackLazy(preloadMap.ImageEmbedCard, 'ImageEmbedCard')
const ImageResponsiveAreasCard = trackLazy(
    preloadMap.ImageResponsiveAreasCard,
    'ImageResponsiveAreasCard',
)
const LottieEmbedCard = trackLazy(preloadMap.LottieEmbedCard, 'LottieEmbedCard')
const IOEventsCard = trackLazy(preloadMap.IOEventsCard, 'IOEventsCard')
const OnboardingCard = trackLazy(preloadMap.OnboardingCard, 'OnboardingCard')
const PaginationCard = trackLazy(preloadMap.PaginationCard, 'PaginationCard')
const LazyCard = trackLazy(preloadMap.LazyCard, 'LazyCard')
const FrameCard = trackLazy(preloadMap.FrameCard, 'FrameCard')

// Chats
const ChatCard = trackLazy(preloadMap.ChatCard, 'ChatCard')

// Containers
const FlipAnimationCard = trackLazy(preloadMap.FlipAnimationCard, 'FlipAnimationCard')
const ErrorCard = trackLazy(preloadMap.ErrorCard, 'ErrorCard')
const SuccessCard = trackLazy(preloadMap.SuccessCard, 'SuccessCard')
const SwitcherCard = trackLazy(preloadMap.SwitcherCard, 'SwitcherCard')
const SubscriptionCard = trackLazy(preloadMap.SubscriptionCard, 'SubscriptionCard')
const OptionalContentCard = trackLazy(preloadMap.OptionalContentCard, 'OptionalContentCard')
const BoxCard = trackLazy(preloadMap.BoxCard, 'BoxCard')
const StickyBoxCard = trackLazy(preloadMap.StickyBoxCard, 'StickyBoxCard')
const SequenceCard = trackLazy(preloadMap.SequenceCard, 'SequenceCard')
const UnionCard = trackLazy(preloadMap.UnionCard, 'UnionCard')
const MiroCard = trackLazy(preloadMap.MiroCard, 'MiroCard')
const TableCard = trackLazy(preloadMap.TableCard, 'TableCard')
const DividedBoxCard = trackLazy(preloadMap.DividedBoxCard, 'DividedBoxCard')
const AjaxGroupCard = trackLazy(preloadMap.AjaxGroupCard, 'AjaxGroupCard')
const MotionBoxCard = trackLazy(preloadMap.MotionBoxCard, 'MotionBoxCard')
const CommentBoxCard = trackLazy(preloadMap.CommentBoxCard, 'CommentBoxCard')
const SlidingSidePanelCard = trackLazy(preloadMap.SlidingSidePanelCard, 'SlidingSidePanelCard')
const SlidingSideBoxCard = trackLazy(preloadMap.SlidingSideBoxCard, 'SlidingSideBoxCard')
const CarouselCard = trackLazy(preloadMap.CarouselCard, 'CarouselCard')
const TooltipCard = trackLazy(preloadMap.TooltipCard, 'TooltipCard')
const FABCard = trackLazy(preloadMap.FABCard, 'FABCard')
// Dates
const DateCard = trackLazy(preloadMap.DateCard, 'DateCard')
const DateWheelCard = trackLazy(preloadMap.DateWheelCard, 'DateWheelCard')
const DateTimeCard = trackLazy(preloadMap.DateTimeCard, 'DateTimeCard')
const DateRangeCard = trackLazy(preloadMap.DateRangeCard, 'DateRangeCard')
const CalendarEventShareCard = trackLazy(
    preloadMap.CalendarEventShareCard,
    'CalendarEventShareCard',
)

// Integrations
const AmoCRMLoginCard = trackLazy(preloadMap.AmoCRMLoginCard, 'AmoCRMLoginCard')
const GoogleSaveDriveCard = trackLazy(preloadMap.GoogleSaveDriveCard, 'GoogleSaveDriveCard')
const GoogleLoginCard = trackLazy(preloadMap.GoogleLoginCard, 'GoogleLoginCard')
const DiscordLoginCard = trackLazy(preloadMap.DiscordLoginCard, 'DiscordLoginCard')
const TelegramLoginCard = trackLazy(preloadMap.TelegramLoginCard, 'TelegramLoginCard')
const TwitterLoginCard = trackLazy(preloadMap.TwitterLoginCard, 'TwitterLoginCard')
const FSLLoginCard = trackLazy(preloadMap.FSLLoginCard, 'FSLLoginCard')
const FSLPaymentButtonCard = trackLazy(preloadMap.FSLPaymentButtonCard, 'FSLPaymentButtonCard')
const TonConnectButtonCard = trackLazy(preloadMap.TonConnectButtonCard, 'TonConnectButtonCard')
const BluetoothListCard = trackLazy(preloadMap.BluetoothListCard, 'BluetoothListCard')
const TelegramWebAppCard = trackLazy(preloadMap.TelegramWebAppCard, 'TelegramWebAppCard')
const TelegramWebAppAutoRedirectCard = trackLazy(
    preloadMap.TelegramWebAppAutoRedirectCard,
    'TelegramWebAppAutoRedirectCard',
)
const JivoChatCard = trackLazy(preloadMap.JivoChatCard, 'JivoChatCard')
const IdenfyVerificationCard = trackLazy(
    preloadMap.IdenfyVerificationCard,
    'IdenfyVerificationCard',
)
const WalletConnectCard = trackLazy(preloadMap.WalletConnectCard, 'WalletConnectCard')
const MetaMaskWalletCard = trackLazy(preloadMap.MetaMaskWalletCard, 'MetaMaskWalletCard')
const CommonWeb3WalletCard = trackLazy(preloadMap.CommonWeb3WalletCard, 'CommonWeb3WalletCard')
const MetaMaskPaymentButtonCard = trackLazy(
    preloadMap.MetaMaskPaymentButtonCard,
    'MetaMaskPaymentButtonCard',
)
const BinanceWalletCard = trackLazy(preloadMap.BinanceWalletCard, 'BinanceWalletCard')
const DataLensCard = trackLazy(preloadMap.DataLensCard, 'DataLensCard')
const TwitterShareButtonCard = trackLazy(
    preloadMap.TwitterShareButtonCard,
    'TwitterShareButtonCard',
)
const TweetEmbedCard = trackLazy(preloadMap.TweetEmbedCard, 'TweetEmbedCard')
const InstagramEmbedCard = trackLazy(preloadMap.InstagramEmbedCard, 'InstagramEmbedCard')
const A0GToolsCard = trackLazy(preloadMap.A0GToolsCard, 'A0GToolsCard')
const A0GFileCard = trackLazy(preloadMap.A0GFileCard, 'A0GFileCard')

// Audio
const AudioAnnotationCard = trackLazy(preloadMap.AudioAnnotationCard, 'AudioAnnotationCard')
const AudioRecordCard = trackLazy(preloadMap.AudioRecordCard, 'AudioRecordCard')
const AudioCard = trackLazy(preloadMap.AudioCard, 'AudioCard')
const VoiceAgentCard = trackLazy(preloadMap.VoiceAgentCard, 'VoiceAgentCard')
const VoiceAgentLegacyCard = trackLazy(preloadMap.VoiceAgentLegacyCard, 'VoiceAgentLegacyCard')

// Texts
const EditableTextCard = trackLazy(preloadMap.EditableTextCard, 'EditableTextCard')
const TextCard = trackLazy(preloadMap.TextCard, 'TextCard')
const TextsListCard = trackLazy(preloadMap.TextsListCard, 'TextsListCard')
const PasswordCard = trackLazy(preloadMap.PasswordCard, 'PasswordCard')
const SecurityCodeCard = trackLazy(preloadMap.SecurityCodeCard, 'SecurityCodeCard')
const TruncatedTextCard = trackLazy(preloadMap.TruncatedTextCard, 'TruncatedTextCard')
const TextChoiceCard = trackLazy(preloadMap.TextChoiceCard, 'TextChoiceCard')
const AjaxSearchBoxCard = trackLazy(preloadMap.AjaxSearchBoxCard, 'AjaxSearchBoxCard')
const PhoneCard = trackLazy(preloadMap.PhoneCard, 'PhoneCard')
const IntStepperCard = trackLazy(preloadMap.IntStepperCard, 'IntStepperCard')

// Images
const ImageCard = trackLazy(preloadMap.ImageCard, 'ImageCard')
const QRCodeCard = trackLazy(preloadMap.QRCodeCard, 'QRCodeCard')
const FewImagesCard = trackLazy(preloadMap.FewImagesCard, 'FewImagesCard')
const ImageMagnifierCard = trackLazy(preloadMap.ImageMagnifierCard, 'ImageMagnifierCard')
const ImageAnnotationCard = trackLazy(preloadMap.ImageAnnotationCard, 'ImageAnnotationCard')

// Pickers
const ChoiceCard = trackLazy(preloadMap.ChoiceCard, 'ChoiceCard')
const BestSelectCard = trackLazy(preloadMap.BestSelectCard, 'BestSelectCard')
const AjaxSelectCard = trackLazy(preloadMap.AjaxSelectCard, 'AjaxSelectCard')
const AjaxCompactSelectCard = trackLazy(preloadMap.AjaxCompactSelectCard, 'AjaxCompactSelectCard')
const RangedIntCard = trackLazy(preloadMap.RangedIntCard, 'RangedIntCard')
const TagsChooseCard = trackLazy(preloadMap.TagsChooseCard, 'TagsChooseCard')
const TagsCard = trackLazy(preloadMap.TagsCard, 'TagsCard')
const AjaxTagsCard = trackLazy(preloadMap.AjaxTagsCard, 'AjaxTagsCard')
const CheckboxCard = trackLazy(preloadMap.CheckboxCard, 'CheckboxCard')
const ColorPickerCard = trackLazy(preloadMap.ColorPickerCard, 'ColorPickerCard')

// Code
const ButtonCustomizationCard = trackLazy(
    preloadMap.ButtonCustomizationCard,
    'ButtonCustomizationCard',
)
const CodeCard = trackLazy(preloadMap.CodeCard, 'CodeCard')
const CSSEditorCard = trackLazy(preloadMap.CSSEditorCard, 'CSSEditorCard')
const MarkdownCard = trackLazy(preloadMap.MarkdownCard, 'MarkdownCard')

// Charts
const GoogleChartCard = trackLazy(preloadMap.GoogleChartCard, 'GoogleChartCard')
const GoogleGeoChartWithClicksCard = trackLazy(
    preloadMap.GoogleGeoChartWithClicksCard,
    'GoogleGeoChartWithClicksCard',
)
const RechartsChartCard = trackLazy(preloadMap.RechartsChartCard, 'RechartsChartCard')
const ChartJSBarCard = trackLazy(preloadMap.ChartJSBarCard, 'ChartJSBarCard')

// Video
const VideoEditorCard = trackLazy(preloadMap.VideoEditorCard, 'VideoEditorCard')
const WebCamCard = trackLazy(preloadMap.WebCamCard, 'WebCamCard')
const VerticalVideoFeedCard = trackLazy(preloadMap.VerticalVideoFeedCard, 'VerticalVideoFeedCard')
const VideoSequenceCard = trackLazy(preloadMap.VideoSequenceCard, 'VideoSequenceCard')

// Projects - GoWithMe
const TripPanelCard = trackLazy(preloadMap.TripPanelCard, 'TripPanelCard')
const TripRouteCard = trackLazy(preloadMap.TripRouteCard, 'TripRouteCard')
const DaysListCard = trackLazy(preloadMap.DaysListCard, 'DaysListCard')

// Projects - Spot
const SpotStatisticListCard = trackLazy(preloadMap.SpotStatisticListCard, 'SpotStatisticListCard')
const SpotCircleDiagramCard = trackLazy(preloadMap.SpotCircleDiagramCard, 'SpotCircleDiagramCard')
const SpotPercentsBarCard = trackLazy(preloadMap.SpotPercentsBarCard, 'SpotPercentsBarCard')
const SpotTemplateFillingCard = trackLazy(
    preloadMap.SpotTemplateFillingCard,
    'SpotTemplateFillingCard',
)
const SpotAlertCard = trackLazy(preloadMap.SpotAlertCard, 'SpotAlertCard')

// Projects - FNS
const FNSOutputTextCard = trackLazy(preloadMap.FNSOutputTextCard, 'FNSOutputTextCard')
const FNSInputTextCard = trackLazy(preloadMap.FNSInputTextCard, 'FNSInputTextCard')
const FNSInputQuestionCard = trackLazy(preloadMap.FNSInputQuestionCard, 'FNSInputQuestionCard')
const FNSSideBarCard = trackLazy(preloadMap.FNSSideBarCard, 'FNSSideBarCard')
const FNSSideBarCardV2 = trackLazy(preloadMap.FNSSideBarCardV2, 'FNSSideBarCardV2')
const FNSStatisticTextCard = trackLazy(preloadMap.FNSStatisticTextCard, 'FNSStatisticTextCard')
const FNSPieChartCard = trackLazy(preloadMap.FNSPieChartCard, 'FNSPieChartCard')
const FNSVerticalChartCard = trackLazy(preloadMap.FNSVerticalChartCard, 'FNSVerticalChartCard')
const FNSAreaChartCard = trackLazy(preloadMap.FNSAreaChartCard, 'FNSAreaChartCard')
const FNSGeoChartCard = trackLazy(preloadMap.FNSGeoChartCard, 'FNSGeoChartCard')
const FNSSelectCard = trackLazy(preloadMap.FNSSelectCard, 'FNSSelectCard')

// Other
const SurveyCard = trackLazy(
    preloadMap.SurveyCard,
    'SurveyCard',
)
const FlyingItemAnimationCard = trackLazy(
    preloadMap.FlyingItemAnimationCard,
    'FlyingItemAnimationCard',
)
const FlameAnimationCard = trackLazy(preloadMap.FlameAnimationCard, 'FlameAnimationCard')
const WeatherWidgetCard = trackLazy(preloadMap.WeatherWidgetCard, 'WeatherWidgetCard')
const SpinnerCard = trackLazy(preloadMap.SpinnerCard, 'SpinnerCard')
const HealthCheckIndicatorCard = trackLazy(
    preloadMap.HealthCheckIndicatorCard,
    'HealthCheckIndicatorCard',
)
const RiggedModelCard = trackLazy(preloadMap.RiggedModelCard, 'RiggedModelCard')
const SpecialEffectsCard = trackLazy(preloadMap.SpecialEffectsCard, 'SpecialEffectsCard')
const SchemaVisualEditorCard = trackLazy(preloadMap.SchemaVisualEditorCard, 'SchemaVisualEditorCard')

// Maps
const GoogleMapsCard = trackLazy(preloadMap.GoogleMapsCard, 'GoogleMapsCard')

// WebRTC
const VoiceChatButtonCard = trackLazy(preloadMap.VoiceChatButtonCard, 'VoiceChatButtonCard')

function UI({
    uiConfig,
    setUiAjaxConfiguration,
    eventEmitter,
    dataTransform,
}: {
    uiConfig: UIConfigType
    setUiAjaxConfiguration?: SetUiAjaxConfigurationType
    eventEmitter?: PieEventEmitter
    dataTransform?: (data: any) => any
}) {
    const cardData = useMemo(() => {
        if (dataTransform && uiConfig.data) {
            return dataTransform(uiConfig.data)
        }
        return uiConfig.data
    }, [uiConfig.data, dataTransform])

    switch (uiConfig.card) {
        case 'FNSOutputTextCard':
            return <FNSOutputTextCard data={cardData} />

        //Buttons
        case 'RedirectButtonCard':
            return <RedirectButtonCard data={cardData} />
        case 'SubmitButtonCard':
            return <SubmitButtonCard data={cardData} />
        case 'ModalButtonCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <ModalButtonCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                    eventEmitter={eventEmitter}
                    dataTransform={dataTransform}
                />
            )
        case 'ClipboardButtonCard':
            return <ClipboardButtonCard data={cardData} />
        case 'AjaxButtonCard':
            return (
                <AjaxButtonCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />
            )
        case 'CheckboxCard':
            return <CheckboxCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />

        //Common
        case 'EmptyCard':
            return <EmptyCard data={cardData} />
        case 'FrameCard':
            return <FrameCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />
        case 'CompiledCard':
            return <CompiledCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />
        case 'URLBasedModalCard':
            return (
                <URLBasedModalCard
                    data={cardData}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )

        case 'LazyCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <LazyCard
                    data={cardData}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                    content={uiConfig.content}
                />
            )
        case 'OnboardingCard':
            return <OnboardingCard data={cardData} />
        case 'PaginationCard':
            return <PaginationCard data={cardData} />
        case 'AutoRedirectCard':
            return <AutoRedirectCard data={cardData} />
        case 'PageConfigurationCard':
            return <PageConfigurationCard data={cardData} />
        case 'ColoredTextCard':
            return <ColoredTextCard data={cardData} />
        case 'CircularProgressCard':
            return <CircularProgressCard data={cardData} />
        case 'ProgressCard':
            return <ProgressCard data={cardData} />
        case 'FileCard':
            return <FileCard data={cardData} />
        case 'TupleCard':
            return <TupleCard data={cardData} />
        case 'HiddenCard':
            return <HiddenCard data={cardData} />
        case 'HiddenGeoCard':
            return <HiddenGeoCard data={cardData} />
        case 'NavigationCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <NavigationCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'MobileBottomNavigationCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <MobileBottomNavigationCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'SideNavigationCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <SideNavigationCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'HTMLEmbedCard':
            return <HTMLEmbedCard data={cardData} />
        case 'ImageEmbedCard':
            return <ImageEmbedCard data={cardData} />
        case 'ImageResponsiveAreasCard':
            return <ImageResponsiveAreasCard data={cardData} />
        case 'LottieEmbedCard':
            return <LottieEmbedCard data={cardData} />
        case 'IOEventsCard':
            return <IOEventsCard data={cardData} />

        // Chats
        case 'ChatCard':
            return <ChatCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />

        //Containers
        case 'FlipAnimationCard':
            if (!(uiConfig.content instanceof Array)) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <FlipAnimationCard
                    data={cardData}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                    content={uiConfig.content}
                />
            )
        case 'ErrorCard':
            return <ErrorCard data={cardData} />
        case 'SuccessCard':
            return <SuccessCard data={cardData} />
        case 'SwitcherCard':
            return <SwitcherCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />
        case 'OptionalContentCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <OptionalContentCard
                    content={uiConfig.content}
                    data={cardData}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'MiroCard':
            return <MiroCard data={cardData} />
        case 'TableCard':
            return <TableCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />
        case 'SubscriptionCard':
            return <SubscriptionCard data={cardData} />
        case 'StickyBoxCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <StickyBoxCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'BoxCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <BoxCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                    eventEmitter={eventEmitter}
                    dataTransform={dataTransform}
                />
            )
        case 'SlidingSidePanelCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <SlidingSidePanelCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'SlidingSideBoxCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <SlidingSideBoxCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'CarouselCard':
            if (!(uiConfig.content instanceof Array)) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <CarouselCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                    eventEmitter={eventEmitter}
                    dataTransform={dataTransform}
                />
            )
        case 'TooltipCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <TooltipCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                    eventEmitter={eventEmitter}
                    dataTransform={dataTransform}
                />
            )
        case 'AjaxGroupCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return <AjaxGroupCard data={cardData} content={uiConfig.content} />
        case 'SequenceCard':
            if (!(uiConfig.content instanceof Array)) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <SequenceCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                    eventEmitter={eventEmitter}
                    dataTransform={dataTransform}
                />
            )
        case 'UnionCard':
            if (!(uiConfig.content instanceof Array)) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <UnionCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                    dataTransform={dataTransform}
                />
            )
        case 'DividedBoxCard':
            return (
                <DividedBoxCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />
            )
        case 'MotionBoxCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <MotionBoxCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                    eventEmitter={eventEmitter}
                    dataTransform={dataTransform}
                />
            )
        case 'CommentBoxCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <CommentBoxCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                    eventEmitter={eventEmitter}
                    dataTransform={dataTransform}
                />
            )
        case 'FABCard':
            if (!(uiConfig.content instanceof Array)) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <FABCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )

        //Dates
        case 'DateCard':
            return <DateCard data={cardData} />
        case 'DateWheelCard':
            return <DateWheelCard data={cardData} />
        case 'DateTimeCard':
            return <DateTimeCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />
        case 'DateRangeCard':
            return <DateRangeCard data={cardData} />
        case 'CalendarEventShareCard':
            return <CalendarEventShareCard data={cardData} />

        //Integrations
        case 'AmoCRMLoginCard':
            return <AmoCRMLoginCard data={cardData} />
        case 'GoogleSaveDriveCard':
            return <GoogleSaveDriveCard data={cardData} />
        case 'GoogleLoginCard':
            return <GoogleLoginCard data={cardData} />
        case 'FSLLoginCard':
            return <FSLLoginCard data={cardData} />
        case 'FSLPaymentButtonCard':
            return <FSLPaymentButtonCard data={cardData} />
        case 'DiscordLoginCard':
            return <DiscordLoginCard data={cardData} />
        case 'TelegramLoginCard':
            return <TelegramLoginCard data={cardData} />
        case 'TwitterLoginCard':
            return <TwitterLoginCard data={cardData} />
        case 'TonConnectButtonCard':
            return (
                <TonConnectButtonCard
                    data={cardData}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'BluetoothListCard':
            return <BluetoothListCard data={cardData} />
        case 'TelegramWebAppCard':
            return <TelegramWebAppCard data={cardData} />
        case 'TelegramWebAppAutoRedirectCard':
            return <TelegramWebAppAutoRedirectCard data={cardData} />
        case 'JivoChatCard':
            return <JivoChatCard data={cardData} />
        case 'IdenfyVerificationCard':
            return <IdenfyVerificationCard data={cardData} />
        case 'WalletConnectCard':
            return <WalletConnectCard data={cardData} />
        case 'CommonWeb3WalletCard':
            return (
                <CommonWeb3WalletCard
                    data={cardData}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'BinanceWalletCard':
            return (
                <BinanceWalletCard
                    data={cardData}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'MetaMaskWalletCard':
            return (
                <MetaMaskWalletCard
                    data={cardData}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'MetaMaskPaymentButtonCard':
            return (
                <MetaMaskPaymentButtonCard
                    data={cardData}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'A0GToolsCard':
            return <A0GToolsCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />
        case 'A0GFileCard':
            return <A0GFileCard data={cardData} />
        case 'DataLensCard':
            return <DataLensCard data={cardData} />
        case 'TwitterShareButtonCard':
            return <TwitterShareButtonCard data={cardData} />
        case 'TweetEmbedCard':
            return <TweetEmbedCard data={cardData} />
        case 'InstagramEmbedCard':
            return <InstagramEmbedCard data={cardData} />

        //Audio
        case 'VoiceAgentLegacyCard':
            return <VoiceAgentLegacyCard
                data={cardData}
            />
        case 'VoiceAgentCard':
            return <VoiceAgentCard
                data={cardData}
                setUiAjaxConfiguration={setUiAjaxConfiguration}
            />
        case 'AudioAnnotationCard':
            return <AudioAnnotationCard data={cardData} />
        case 'AudioRecordCard':
            return <AudioRecordCard data={cardData} />
        case 'AudioCard':
            return <AudioCard data={cardData} />
        //Texts
        case 'TextChoiceCard':
            return <TextChoiceCard data={cardData} />
        case 'EditableTextCard':
            return (
                <EditableTextCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />
            )
        case 'TextCard':
            return (
                <TextCard
                    data={cardData}
                    eventEmitter={eventEmitter}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'TextsListCard':
            return <TextsListCard data={cardData} />
        case 'PasswordCard':
            return <PasswordCard data={cardData} />
        case 'SecurityCodeCard':
            return <SecurityCodeCard data={cardData} />
        case 'CSSEditorCard':
            return <CSSEditorCard data={cardData} />
        case 'TruncatedTextCard':
            return <TruncatedTextCard data={cardData} />
        case 'MarkdownCard':
            return <MarkdownCard data={cardData} />

        case 'AjaxSearchBoxCard':
            if (!setUiAjaxConfiguration) {
                throw new Error(`AjaxSelectCard will not work without AjaxGroup`)
            }
            return (
                <AjaxSearchBoxCard
                    data={cardData}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )

        case 'PhoneCard':
            return <PhoneCard data={cardData} />
        case 'IntStepperCard':
            return (
                <IntStepperCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />
            )

        //Images
        case 'ImageCard':
            return <ImageCard data={cardData} />
        case 'FewImagesCard':
            return <FewImagesCard data={cardData} />
        case 'QRCodeCard':
            return <QRCodeCard data={cardData} />
        case 'ImageMagnifierCard':
            return <ImageMagnifierCard data={cardData} />
        case 'ImageAnnotationCard':
            return <ImageAnnotationCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />

        //Pickers
        case 'ChoiceCard':
            return <ChoiceCard data={cardData} />
        case 'BestSelectCard':
            return <BestSelectCard data={cardData} />
        case 'AjaxSelectCard':
            if (!setUiAjaxConfiguration) {
                throw new Error(`AjaxSelectCard will not work without AjaxGroup`)
            }
            return (
                <AjaxSelectCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />
            )
        case 'AjaxCompactSelectCard':
            if (!setUiAjaxConfiguration) {
                throw new Error(`AjaxCompactSelectCard will not work without AjaxGroup`)
            }
            return (
                <AjaxCompactSelectCard
                    data={cardData}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'RangedIntCard':
            return <RangedIntCard data={cardData} />
        case 'TagsChooseCard':
            return (
                <TagsChooseCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />
            )
        case 'TagsCard':
            return (
                <TagsCard
                    data={cardData}
                    eventEmitter={eventEmitter}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'AjaxTagsCard':
            if (!setUiAjaxConfiguration) {
                throw new Error(`AjaxTagsCard will not work without AjaxGroup`)
            }
            return <AjaxTagsCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />
        case 'ColorPickerCard':
            return <ColorPickerCard data={cardData} />
        //Code
        case 'ButtonCustomizationCard':
            return <ButtonCustomizationCard data={cardData} />
        case 'ClipboardCard':
            return <ClipboardCard data={cardData} />
        case 'CodeCard':
            return <CodeCard data={cardData} />

        // Charts
        case 'GoogleChartCard':
            return <GoogleChartCard data={cardData} />
        case 'RechartsChartCard':
            return <RechartsChartCard data={cardData} />
        case 'GoogleGeoChartWithClicksCard':
            return <GoogleGeoChartWithClicksCard data={cardData} />
        case 'ChartJSBarCard':
            return <ChartJSBarCard data={cardData} />

        // Video
        case 'VideoEditorCard':
            return <VideoEditorCard data={cardData} />
        case 'WebCamCard':
            return <WebCamCard data={cardData} />
        case 'VerticalVideoFeedCard':
            return (
                <VerticalVideoFeedCard
                    data={cardData}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'VideoSequenceCard':
            return (
                <VideoSequenceCard
                    data={cardData}
                />
            )

        //Projects
        //Spot
        case 'SpotStatisticListCard':
            return <SpotStatisticListCard data={cardData} />
        case 'SpotPercentsBarCard':
            return <SpotPercentsBarCard data={cardData} />
        case 'SpotCircleDiagramCard':
            return <SpotCircleDiagramCard data={cardData} />
        case 'SpotTemplateFillingCard':
            return <SpotTemplateFillingCard data={cardData} />
        case 'SpotAlertCard':
            return <SpotAlertCard data={cardData} />

        //GoWithMe
        case 'DaysListCard':
            return <DaysListCard data={cardData} />
        case 'TripPanelCard':
            return <TripPanelCard data={cardData} />
        case 'TripRouteCard':
            return <TripRouteCard data={cardData} />
        //FNS
        case 'FNSSideBarCard':
            return <FNSSideBarCard data={cardData} />
        case 'FNSSideBarCardV2':
            return <FNSSideBarCardV2 data={cardData} />
        case 'FNSInputTextCard':
            return <FNSInputTextCard data={cardData} />
        case 'FNSInputQuestionCard':
            return <FNSInputQuestionCard data={cardData} />
        case 'FNSStatisticTextCard':
            return <FNSStatisticTextCard data={cardData} />
        case 'FNSPieChartCard':
            return <FNSPieChartCard data={cardData} />
        case 'FNSVerticalChartCard':
            return <FNSVerticalChartCard data={cardData} />
        case 'FNSAreaChartCard':
            return <FNSAreaChartCard data={cardData} />
        case 'FNSGeoChartCard':
            return <FNSGeoChartCard data={cardData} />
        case 'FNSSelectCard':
            return <FNSSelectCard data={cardData} />
        // Other
        case 'SurveyCard':
            return <SurveyCard
                data={cardData}
                setUiAjaxConfiguration={setUiAjaxConfiguration}
            />
        case 'FlyingItemAnimationCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return <FlyingItemAnimationCard
                data={cardData}
                content={uiConfig.content}
                setUiAjaxConfiguration={setUiAjaxConfiguration}
            />

        case 'FlameAnimationCard':
            return <FlameAnimationCard data={cardData} />
        case 'WeatherWidgetCard':
            return <WeatherWidgetCard data={cardData} />
        case 'SpinnerCard':
            return <SpinnerCard data={cardData} />
        case 'HealthCheckIndicatorCard':
            return <HealthCheckIndicatorCard data={cardData} />
        case 'RiggedModelCard':
            return <RiggedModelCard data={cardData} />
        case 'SpecialEffectsCard':
            if (uiConfig.content instanceof Array) {
                throw new Error(`Invalid ui content type "${uiConfig.content}"`)
            }
            return (
                <SpecialEffectsCard
                    data={cardData}
                    content={uiConfig.content}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
        case 'SchemaVisualEditorCard':
            return <SchemaVisualEditorCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />
        //Maps
        case 'GoogleMapsCard':
            return (
                <GoogleMapsCard data={cardData} setUiAjaxConfiguration={setUiAjaxConfiguration} />
            )
        // WebRTC
        case 'VoiceChatButtonCard':
            return (
                <VoiceChatButtonCard
                    data={cardData}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )

        //Default
        default:
            return (
                <UiConstructor
                    uiConfig={uiConfig}
                    setUiAjaxConfiguration={setUiAjaxConfiguration}
                />
            )
    }
}

export default UI
