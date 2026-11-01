/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/alt-text */
import { useEffect, useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { Image as DatoImage } from 'react-datocms';
import { v4 as uuidv4 } from 'uuid';

import { UpdatePath } from 'components/Donate/Donate.utils';
import Donate from 'components/v1/Donate';
import { IStepPayload } from 'components/v1/Donate/Donate.types';
import { stepNavigation } from 'components/v1/Donate/DonationNavigation/DonationNavigation.utils';
import { GTMecommerce } from 'utils/global-utils';
import { useWindowDimensions } from 'utils/useWindowDimensions';

import RecaptureDonation from './campaignDonation';
import { donationDetail, Image } from './CampaignInformation.types';
import Button from '../Button/Button';
import CarouselImage from '../CarouselImage/CarouselImage';
import IconLibrary from '../IconLibrary/IconLibrary';
import Link from '../Link/Link';
import PillCollection from '../PillCollection/PillCollection';
import PlayerVideo from '../PlayerVideo/PlayerVideo';
import RichText from '../RichText/RichText';
import Spinner from '../Spinner/Spinner';
import * as S from '../v1/Project/Project.style';
import { CampaignProjectProps } from '../v1/Project/Project.types';

const Project = ({
  content,
  isPreview = false,
  globalDefaultImage,
}: CampaignProjectProps) => {
  const { width } = useWindowDimensions();
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUB_KEY!);

  const [donationDetails, setDonationDetails] = useState<donationDetail>();

  const [Images, setImages] = useState<Image[]>([]); // Specify the type here
  const [buttonShareLink, setButtonShareLink] = useState('Copy Link');
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  const [isRecaptureVisible, setIsRecaptureVisible] = useState(false);
  const [isPaymentSettingsLoading, setIsPaymentSettingsLoading] =
    useState<boolean>(true);
  const [paymentSettings, setPaymentSettings] = useState({});
  const [productEnrollmentId, setProductEnrollmentId] = useState<string>('');

  const nextRouter = useRouter();
  const nextSearchParams = useSearchParams();
  const donationClicked = nextSearchParams.get('modalOpen') ?? 'false';
  const isProjectContentLoading = typeof content !== 'object';
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  const thumbnailRef = Images.filter(
    (image: any) => image.Type === 'Cover_Image',
  );
  const hasThumbnailImage = thumbnailRef?.length > 0;
  const modal = {
    value: isDonationModalOpen,
    setter: setIsDonationModalOpen,
  };

  const taxStatement = `<p>The Australian Sports Foundation (ASF) is the only deductible gift recipient for sport in Australia. This means that donations of $2 or more to approved projects on our website are tax deductible. Shortly after making your donation, you'll receive an official receipt from the ASF that you can use in your income tax return. If you have any questions about your donation, please visit <a href='${process.env.NEXT_PUBLIC_SITE_URL}/faqs' target=”_blank”>${process.env.NEXT_PUBLIC_SITE_URL}/faqs</a></p>`;

  if (
    typeof window !== 'undefined' &&
    content.Donations &&
    content.Donations.length > 0
  ) {
    const totalDonors = content.Donations.length ?? 20;
    let totalDonations = 0;
    const sortedArray = content.Donations.slice().sort(
      (a, b) => b.Amount - a.Amount,
    );
    const medianIndex = sortedArray.length > 1 ? Math.ceil(totalDonors / 2) : 0;
    const medianDonationAmount = Math.round(sortedArray[medianIndex].Amount);

    content.Donations.map((donation: any) => {
      totalDonations += Number(donation.Amount);
    });

    const averageDonationAmount = Math.round(totalDonations / totalDonors);
    const sportType = content.SportType;
    const percentageToTarget =
      content.DonationsReceived === 0
        ? 0
        : Math.round((content.DonationsReceived / content.Target) * 100); //* If there is no target, value returned will be 'Infinity'
    const projectType = content.Type;

    //* Add average donation amount to window object
    window.experiment = {
      ...window.experiment,
      sportType: sportType,
      projectType: projectType,
      percentageToTarget: percentageToTarget,
      averageDonationAmount: averageDonationAmount,
      medianDonationAmount: medianDonationAmount,
    };
  }

  const publicKeys = {
    ewayKey: process.env.NEXT_PUBLIC_EWAY_PUB_KEY,
    stripeKey: process.env.NEXT_PUBLIC_STRIPE_PUB_KEY,
  };

  useEffect(() => {
    if (donationDetails?.productEnrollmentName && Images.length > 0) {
      setIsPageLoaded(true);
    } else {
      console.warn(
        "productEnrollmentName or Images doesn't exist.",
        '\n         productEnrollmentName:',
        donationDetails?.productEnrollmentName,
        '\n         Images:',
        Images,
      );
    }
  }, [donationDetails, Images]);

  useEffect(() => {
    if (content.productEnrolmentId && !donationDetails?.productEnrollmentName) {
      setProductEnrollmentId(content.productEnrolmentId);
    }
  }, [content.productEnrolmentId]);

  useEffect(() => {
    const linkTimer = setTimeout(() => {
      setButtonShareLink('Copy link');
    }, 3000);

    return () => {
      clearTimeout(linkTimer);
    };
  }, [buttonShareLink]);

  const imageCollection = () => {
    const coverImages = Images.filter(
      (image: any) => image.Type === 'Cover_Image',
    );
    const imageGallery = Images.filter(
      (image: any) => image.Type === 'Gallery' || image.Type === 'Thumbnail',
    );
    const logo = Images.filter((image: any) => image.Type === 'Logo');
    content.logoImage = logo[0]?.UrlS3 ?? logo[0]?.Url;
    const imageCollection: any = [];

    // Add cover images first
    coverImages.forEach((image: any) => {
      imageCollection.push({
        image: {
          responsiveImage: {
            alt: image.altText,
            aspectRatio: 0,
            base64: '',
            bgColor: '',
            height: 900,
            sizes: '',
            src: image.UrlS3
              ? image.UrlS3
              : image.Url
              ? image.Url
              : globalDefaultImage.coverImage.url,
            srcSet: '',
            title: '',
            webpSrcSet: '',
            width: 1600,
          },
        },
      });
    });

    imageGallery.forEach((image: any) => {
      imageCollection.push({
        image: {
          responsiveImage: {
            alt: image.altText,
            aspectRatio: 0,
            base64: '',
            bgColor: '',
            height: 900,
            sizes: '',
            src: image.UrlS3 ? image.UrlS3 : image.Url,
            srcSet: '',
            title: '',
            webpSrcSet: '',
            width: 1600,
          },
        },
      });
    });

    return imageCollection;
  };

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const axios = require('axios');

  const fetchData = async () => {
    await axios
      .get(
        `/api/v2/settings?productEnrollmentId=${
          productEnrollmentId || content.productEnrolmentId
        }&donationAmount=${0}&method=getGlobalSettings&method=getFundraiserDonationDetails`,
      )
      .then((res: any) => {
        setPaymentSettings(res.data.data.items.getGlobalSettings);

        const donationDetails =
          res.data.data.items.fundraisers[0].methods
            .getFundraiserDonationDetails;

        const recentDonations =
          donationDetails?.showRecentDonations === 'false'
            ? []
            : donationDetails?.recentDonations || [];

        const imagesArray =
          donationDetails?.images?.map(
            (item: { url: string; altText: string; imageType: string }) => {
              return {
                UrlS3: item.url,
                altText: item.altText,
                Type: item.imageType,
              };
            },
          ) || [];

        setImages(imagesArray);
        const updateDonorData = recentDonations?.map((item: any) => {
          return {
            DonorName: item.donorName,
            Amount: item.amount,
            Text:
              donationDetails?.showSupportMessages === 'false'
                ? ''
                : item.contributorMessage,
            donationDateTime: item.donationDate,
            metadata: item.metadata,
          };
        });

        const amounts = [
          donationDetails?.donationOption1,
          donationDetails?.donationOption2,
          donationDetails?.donationOption3,
          donationDetails?.donationOption4,
        ];
        const defaultAmounts = ['10', '50', '100', '500'];

        setDonationDetails({
          orgName: content.orgName,
          productEnrollmentName: donationDetails?.productEnrollmentName,
          raisedAmount: donationDetails?.raisedAmount,
          percentage: donationDetails?.percentage,
          targetAmount: donationDetails?.targetAmount,
          donorCount: donationDetails?.donorCount,
          showThermometer: donationDetails?.showThermometer,
          showAmountRaised: donationDetails?.showAmountRaised,
          showFundraisingTarget: donationDetails?.showFundraisingTarget,
          Donations: updateDonorData,
          Amounts: donationDetails?.donationOption1?.length
            ? amounts
            : defaultAmounts,
          customThankyouMessage: donationDetails?.customThankyouMessage,
          description: donationDetails?.description,
          youtubeId: donationDetails?.youtubeId,
          customerType: !!donationDetails?.customerType
            ? donationDetails?.customerType
            : [],
          displayDonorDetails: true,
          acceptRegularGiving: donationDetails?.acceptRegularGiving,
          endDate: donationDetails?.endDate,
          productName: donationDetails?.productName,
        });

        setIsPaymentSettingsLoading(false);

        setStepPayload({
          ...stepPayload,
          donationDetails: {
            ...stepPayload.donationDetails,
            orgName: content.orgName,
            customerType: !!donationDetails?.customerType
              ? donationDetails?.customerType
              : [],
            acceptRegularGiving: donationDetails?.acceptRegularGiving,
            endDate: donationDetails?.endDate,
            productName: donationDetails?.productName,
          },
        });
      })
      .catch((err: any) => {
        console.error(
          'There was an error fetching the payment settings, here is the message: ',
          err.response.data,
        );
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (donationClicked === 'true' && !isProjectContentLoading) {
      document.querySelector('body')?.classList.add('-lockForm');
    } else {
      document.querySelector('body')?.classList.remove('-lockForm');
    }
  }, [donationClicked, isProjectContentLoading]);

  const [stepPayload, setStepPayload] = useState<IStepPayload>({
    step: stepNavigation.getInitialStep(),
    donationDetails: {
      orgName: '',
      donationFrequency: 'once',
      donationAmount: 0,
      amountEntered: '',
      selectedFrequency: {
        once: true,
        monthly: false,
      },
      isRecurring: false,
      customAmount: 0,
      paymentMethod: '',
      walletPayment: {
        applePay: false,
        googlePay: false,
        canMakePayment: false,
      },
      customerType: [],
      displayDonorDetails: true,
    },
    paymentDetails: {
      cardNumber: '',
      expiryDate: '',
      formattedDate: '',
      cvv: '',
      nameOnCard: '',
      cardType: '',
      directDebitDetails: {
        directDebitSecret: '',
        paymentMethodId: '',
        paymentIntentId: '',
        directDebitStripeInstance: null,
        directDebitStripeElement: null,
      },
    },
    donorDetails: {
      firstName: '',
      lastName: '',
      organisationName: '',
      phoneNumber: '',
      email: '',
    },
    donorMessage: {
      isAnonymous: false,
      isOrgAnonymous: false,
      publicMessage: '',
    },
    donorFees: {
      coverFee: true,
      subscribeToMail: true,
      agreeToTermsAndConditions: false,
      retentionRate: 0,
      feeAmount: 0,
      isPaymentProcessingFeeCovered: true,
      isPlatformCostCovered: true,
    },
    donationHeaders: {
      captchaToken: '',
      projectId: content.Id!,
      uuidIdentifier: uuidv4(),
    },
    globalSettings: {
      creditCard: {
        enabled: true,
        paymentMethodType: '',
      },
      directDebit: {
        enabled: true,
        paymentMethodType: '',
      },
      eft: {
        enabled: true,
        paymentMethodType: '',
      },
    },
    paymentIntent: '',
  });

  const recaptureDonation = (currentPayload: IStepPayload) => {
    const donationString = String(
      stepPayload.donationDetails?.donationAmount ?? '',
    );
    if (
      donationString.length > 0 ||
      (currentPayload.donationDetails?.donationAmount &&
        currentPayload.donationDetails?.donationAmount > 0)
    ) {
      return (
        <div className="recapture__container">
          <span className="close__recapture">
            <IconLibrary iconName="cross-clear" className="-clean" />
          </span>
          <h2 className="recapture__heading">
            Complete your ${currentPayload.donationDetails!.donationAmount}{' '}
            donation to {content.orgName}
          </h2>
          <div className="recapture__cta__container">
            <Button
              iconName=""
              isIconOnly={false}
              label="Continue donation"
              type="button"
              onClick={() => {
                UpdatePath('true', nextRouter);
                modal.setter!(true);

                setIsRecaptureVisible(false);
              }}
            />
            <Button
              className="-secondary -inverted"
              iconName=""
              isIconOnly={false}
              label="Not today"
              type="button"
              onClick={() => {
                UpdatePath('false', nextRouter);
                modal.setter!(false);
                setIsRecaptureVisible(false);
              }}
            />
          </div>
        </div>
      );
    }
  };

  const completeContent: any = {
    ...content,
    Amounts: donationDetails?.Amounts,
    donationDetails,
    Images,
    Name: content.name,
    Organisation: content.orgName,
  };

  // Handler for pill click
  const handlePillClick = (label: string) => {
    console.log("Pill clicked:", label);
    nextRouter.push(`/campaigns?sport=${encodeURIComponent(label)}`);
  };

  return (
    <S.Project
      className={`project ${isPreview === 'true' ? '-previewMode' : ''}`}
    >
      {isRecaptureVisible &&
        donationClicked === 'false' &&
        recaptureDonation(stepPayload)}

      {isProjectContentLoading ? (
        <Spinner className="-secondary" />
      ) : (
        isPageLoaded && (
          <div>
            {donationClicked === 'true' && !isPaymentSettingsLoading && (
              <Elements stripe={stripePromise}>
                <Donate
                  paymentSettings={paymentSettings}
                  projectInformation={completeContent}
                  isOpen={modal}
                  paymentKeys={publicKeys}
                  stepPayload={stepPayload}
                  setStepPayload={setStepPayload}
                  isRecaptureVisible={setIsRecaptureVisible}
                  productEnrollmentId={
                    productEnrollmentId || content.productEnrolmentId
                  }
                />
              </Elements>
            )}

            <div className="project__title">
              <h1>{content.name}</h1>
            </div>

            <div className="project__detail__container">
              <div className="project__content">
                {imageCollection().length > 0 ? (
                  hasThumbnailImage && width < 768 ? (
                    <div className="mobile__image__container">
                      <img
                        className="mobile__thumbnail__image"
                        src={thumbnailRef[0].UrlS3 ?? thumbnailRef[0].Url}
                        alt=""
                      />
                    </div>
                  ) : (
                    <CarouselImage
                      imageCollection={imageCollection()}
                      hasAutoscroll
                    />
                  )
                ) : (
                  <div className="default__image">
                    <DatoImage
                      data={{
                        alt: '',
                        aspectRatio: 0,
                        base64: '',
                        bgColor: '',
                        height: 900,
                        sizes: '',
                        src: globalDefaultImage.coverImage.url,
                        srcSet: '',
                        title: '',
                        webpSrcSet: '',
                        width: 1600,
                      }}
                    />
                  </div>
                )}

                {donationDetails?.productEnrollmentName && (
                  <RecaptureDonation
                    content={donationDetails}
                    setIsRecaptureVisible={setIsRecaptureVisible}
                    isPaymentSettingsLoading={isPaymentSettingsLoading}
                    setIsDonationModalOpen={setIsDonationModalOpen}
                    isMobile
                  />
                )}

                <div className="project__description">
                  <DatoImage
                    data={{
                      alt: '',
                      aspectRatio: 0,
                      base64: '',
                      bgColor: '',
                      height: 85,
                      sizes: '',
                      src: content.logoImage
                        ? content.logoImage
                        : globalDefaultImage.logo.url,
                      srcSet: '',
                      title: '',
                      webpSrcSet: '',
                      width: 85,
                    }}
                  />

                  <div className="supporter__link">
                    <h2>
                      Your donation is supporting{' '}
                      <span className="organisation">{content.orgName}</span>
                    </h2>

                    {content.websiteUrl && (
                      <Link
                        openNewTab
                        linkLabel="Visit website"
                        link={content.websiteUrl}
                      />
                    )}
                  </div>
                </div>

                <div className="project__freetext__container">
                  <RichText html={content.description} />
                </div>

                {donationDetails?.youtubeId && (
                  <PlayerVideo
                    internalSource={null}
                    externalSource={{
                      url: '',
                      providerUid: donationDetails?.youtubeId,
                      provider: 'youtube',
                    }}
                  />
                )}

                {content.pills.blocks[0]?.pillCollection && (
                  <PillCollection
                    pillCollection={content.pills.blocks[0].pillCollection.map(
                      (pill: any) => ({
                        ...pill,
                        isClickable: true,
                        onPillClick: () => handlePillClick('label'),
                      }),
                    )}
                  />
                )}

                <div className="tax__description">
                  <h3>Your donation to this project is tax deductible</h3>
                  <RichText html={taxStatement} />
                  <Button
                    className="donation__button__regular"
                    label="Donate Now"
                    id="donate-secondary-desktop"
                    type="button"
                    iconName=""
                    isIconOnly={false}
                    onClick={() => {
                      UpdatePath('true', nextRouter);
                      setIsDonationModalOpen(true);
                      setIsRecaptureVisible(false);
                      GTMecommerce(
                        content.name,
                        content.orgName,
                        content.Type ? content.Type : '',
                        content.SportType ? content.SportType : '',
                      );
                    }}
                    isDisabled={
                      isPreview === 'true' ? true : isPaymentSettingsLoading
                    }
                  />
                </div>
              </div>
              {donationDetails?.productEnrollmentName && (
                <RecaptureDonation
                  content={donationDetails}
                  setIsRecaptureVisible={setIsRecaptureVisible}
                  isPaymentSettingsLoading={isPaymentSettingsLoading}
                  setIsDonationModalOpen={setIsDonationModalOpen}
                  isMobile={false}
                />
              )}
            </div>

            <div className="tax__description__mobile">
              <h3>Your donation to this project is tax deductible</h3>
              <RichText html={taxStatement} />
              <Button
                className="donation__button__regular"
                label="Donate Now"
                id="donate-secondary-mobile"
                type="button"
                iconName=""
                isIconOnly={false}
                onClick={() => {
                  UpdatePath('true', nextRouter);
                  setIsDonationModalOpen(true);
                  setIsRecaptureVisible(false);
                  GTMecommerce(
                    content.name,
                    content.orgName,
                    content.Type ? content.Type : '',
                    content.SportType ? content.SportType : '',
                  );
                }}
                isDisabled={
                  isPreview === 'true' ? true : isPaymentSettingsLoading
                }
              />
            </div>
          </div>
        )
      )}
    </S.Project>
  );
};

export default Project;
