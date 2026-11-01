// src/components/v1/Project/Project.tsx
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
import { SetStateAction, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Stable persistent donation ID hook
function usePersistentDonationId() {
  const getOrCreateId = () => {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem('donationId');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('donationId', id);
    }
    return id;
  };
  const donationIdRef = useRef(getOrCreateId());
  return donationIdRef.current;
}

import ProgressBar from '@ramonak/react-progress-bar';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';


import Button from 'components/Button/Button';
import CarouselImage from 'components/CarouselImage/CarouselImage';
import { UpdatePath } from 'components/Donate/Donate.utils';
import DonationAccordion from 'components/DonationAccordion/DonationAccordion';
import DonationTabsCollection from 'components/DonationTabsCollection/DonationTabsCollection';
import IconLibrary from 'components/IconLibrary/IconLibrary';
import Link from 'components/Link/Link';
import Pagination from 'components/Pagination/Pagination';
import PillCollection from 'components/PillCollection/PillCollection';
import PlayerVideo from 'components/PlayerVideo/PlayerVideo';
import RichText from 'components/RichText/RichText';
import SocialShare from 'components/SocialShare/SocialShare';
import Spinner from 'components/Spinner/Spinner';
import Donate from 'components/v1/Donate';
import { IStepPayload } from 'components/v1/Donate/Donate.types';
import { convertDonation } from 'utils/global-utils';
import { GTM_EVENTS, pushGtmEcommerceEvent } from 'utils/gtm';
import { useWindowDimensions } from 'utils/useWindowDimensions';

import * as S from './Project.style';
import { IProjectProps } from './Project.types';
import { stepNavigation } from '../Donate/DonationNavigation/DonationNavigation.utils';

const Project = ({
  content,
  communityTabContent,
  loadingTabs,
  isPreview = false,
}: IProjectProps) => {
  const { width } = useWindowDimensions();
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUB_KEY!);
  const [currentPage, setCurrentPage] = useState('1');
  const [isDonationExpanded, setIsDonationExpanded] = useState(false);
  const [buttonShareLink, setButtonShareLink] = useState('Copy Link');
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  let donationString = '';
  const [isRecaptureVisible, setIsRecaptureVisible] = useState(false);
  const [isPaymentSettingsLoading, setIsPaymentSettingsLoading] =
    useState<boolean>(true);
  const [paymentSettings, setPaymentSettings] = useState({});
  const totalPages = Math.ceil(content.Donations.length / 4);
  const nextRouter = useRouter();
  const nextSearchParams = useSearchParams();
  const donationClicked = nextSearchParams.get('modalOpen') ?? 'false';
  const isProjectContentLoading = typeof content !== 'object';
  const thumbnailRef = content.Images.filter(
    (image) => image.Type === 'Thumbnail',
  );
  const hasThumbnailImage = thumbnailRef?.length > 0;
  const modal = {
    value: isDonationModalOpen,
    setter: setIsDonationModalOpen,
  };
  const urlPath = nextRouter.asPath.split('?')[0];
  const renderCommunityTabs =
    communityTabContent!.length > 0 || content.CommunityProjectType === 'Open';

  const pillData = [
    {
      label: content.SportType,
    },
  ];
  const projectCompletion = Math.round(
    (content.DonationsReceived / content.Target) * 100,
  );
  const taxStatement = `<p>The Australian Sports Foundation (ASF) is the only deductible gift recipient for sport in Australia. This means that donations of $2 or more to approved projects on our website are tax deductible. Shortly after making your donation, you'll receive an official receipt from the ASF that you can use in your income tax return. If you have any questions about your donation, please visit <a href='${process.env.NEXT_PUBLIC_SITE_URL}/faqs' target=”_blank”>${process.env.NEXT_PUBLIC_SITE_URL}/faqs</a></p>`;

  const paginate = (pageNum: SetStateAction<string>) => {
    setCurrentPage(pageNum);
  };

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

  // * Slicing donations array to get 4 at a time, and passing this into the Donations Accordion.
  const indexOfLastDonation = Number(currentPage) * 4;
  const indexOfFirstDonation = indexOfLastDonation - 4;
  const currentDonations = content.Donations.slice(
    indexOfFirstDonation,
    indexOfLastDonation,
  );

  const handleButtonClick = () => {
    setButtonShareLink('Link copied!');
  };

  const publicKeys = {
    ewayKey: process.env.NEXT_PUBLIC_EWAY_PUB_KEY,
    stripeKey: process.env.NEXT_PUBLIC_STRIPE_PUB_KEY,
  };

  useEffect(() => {
    const linkTimer = setTimeout(() => {
      setButtonShareLink('Copy link');
    }, 3000);

    return () => {
      clearTimeout(linkTimer);
    };
  }, [buttonShareLink]);

  const logoImage = () => {
    for (let i = 0; i < content.Images.length; i++) {
      if (!!content.Images[i].Type && content.Images[i].Type === 'Logo') {
        const currentLogo = content.Images[i].UrlS3
          ? content.Images[i].UrlS3
          : content.Images[i].Url;

        return currentLogo;
      }
    }

    return '';
  };

  const imageCollection = () => {
    const imageGallery = content.Images.filter(
      (image) => image.Type === 'Gallery' || image.Type === 'Thumbnail',
    );

    const imageCollection: any = [];

    imageGallery.forEach((image) => {
      imageCollection.push({
        image: {
          responsiveImage: {
            alt: '',
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

  const youtubeLink = {
    url: '',
    providerUid: content.YouTubeId,
    provider: 'youtube',
  };

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const axios = require('axios');

  // const fetchData = async (donationId: string) => {
  //   await axios
  //     .get(`/api/payment-settings?donationId=${donationId}`)
  //     .then((res: any) => {
  //       setPaymentSettings(res.data.data.items[0]);
  //       setIsPaymentSettingsLoading(false);
  //     })
  //     .catch((err: any) => {
  //       console.error(
  //         'There was an error fetching the payment settings, here is the message: ',
  //         err.response.data,
  //       );
  //     });
  // };

  const fetchData = async () => {
    await axios
      .get(
        `/api/v2/settings?productEnrollmentId=${
          process.env.NEXT_PUBLIC_PRODUCT_ENROLLMENT_ID
        }&donationAmount=${0}&method=getGlobalSettings`,
      )
      .then((res: any) => {
        setPaymentSettings(res.data.data.items.getGlobalSettings);
        setIsPaymentSettingsLoading(false);
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
      showRegularGivingUpsell: false,
      displayDonorDetails: true,
      acceptRegularGiving: false,
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
      uuidIdentifier: usePersistentDonationId(),
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
    donationString = String(stepPayload.donationDetails?.donationAmount ?? '');
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
            donation to {content.Organisation}
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

  //* GTM Ecommerce Tracking
  const GTMecommerce = () => {
    pushGtmEcommerceEvent({
      event: GTM_EVENTS.ADD_TO_CART,
      ecommerce: {
        currencyCode: 'AUD',
        add: {
          products: [
            {
              name: content.Name, //Organisation, Club or Athlete Name
              id: content.Organisation, //Project short details (optional)
              price: '0.001', //No price. for Google Analytics system to count the price > 0
              brand: 'Australian Sports Foundation', //same for all projects supported by ASF
              category: content.Type, // or 'Clubs & Organisation'
              variant: content.SportType, //Club's sport category
              quantity: 1,
            },
          ],
        },
      },
    });
  };

  return (
    <S.Project className={`project ${isPreview ? '-previewMode' : ''}`}>
      {isRecaptureVisible &&
        donationClicked === 'false' &&
        recaptureDonation(stepPayload)}
      {isProjectContentLoading ? (
        <Spinner className="-secondary" />
      ) : (
        <div className="container">
          {donationClicked === 'true' && !isPaymentSettingsLoading && (
            <Elements stripe={stripePromise}>
              <Donate
                paymentSettings={paymentSettings}
                projectInformation={{
                  ...content,
                  productEnrolmentId: 'Not in use',
                  fundraiserId: 'Not in use',
                  campaignId: 'Not in use',
                }}
                isOpen={modal}
                paymentKeys={publicKeys}
                stepPayload={stepPayload}
                setStepPayload={setStepPayload}
                isRecaptureVisible={setIsRecaptureVisible}
              />
            </Elements>
          )}
          <div className="project__title">
            <h1>{content.Name}</h1>
          </div>
          <div className="project__detail__container">
            <div className="project__content">
              {imageCollection().length > 0 &&
                (hasThumbnailImage && width < 768 ? (
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
                ))}
              <div className="donation__amount__mobile">
                {content.ShowThermometer && (
                  <>
                    <div className="donation__target">
                      <div className="donation__raised">
                        <h2>Raised</h2>
                        <h3>${convertDonation(content.DonationsReceived)}</h3>
                      </div>
                      <div className="donation__goal">
                        <h2>Goal</h2>
                        <h3>${convertDonation(content.Target)}</h3>
                      </div>
                    </div>

                    <ProgressBar
                      className="progress__bar__mobile"
                      completed={
                        projectCompletion < 1 ? '1' : projectCompletion
                      }
                      customLabel=" "
                      bgColor="#037d6e"
                      baseBgColor="#C9C8C7"
                      borderRadius="0"
                      height="8px"
                    />
                  </>
                )}
                <Button
                  className={`donation__button ${
                    isPaymentSettingsLoading ? '-disabled' : ''
                  }`}
                  label="Donate Now"
                  id="donate-primary-mobile"
                  type="button"
                  iconName=""
                  isIconOnly={false}
                  onClick={() => {
                    UpdatePath('true', nextRouter);
                    setIsDonationModalOpen(true);
                    setIsRecaptureVisible(false);
                    GTMecommerce();
                  }}
                  isDisabled={isPaymentSettingsLoading}
                />
              </div>
              <div className="project__description">
                {logoImage() && (
                  <Image
                    className="thumbnail__image"
                    loader={() => logoImage()}
                    width={85}
                    height={85}
                    src={logoImage()}
                    alt=""
                  />
                )}
                <div className="supporter__link">
                  <h2>
                    Your donation is supporting{' '}
                    <span className="organisation">{content.Organisation}</span>
                  </h2>
                  {content.WebURL && (
                    <Link
                      openNewTab
                      linkLabel="Visit website"
                      link={content.WebURL}
                    />
                  )}
                </div>
              </div>
              <div className="project__freetext__container">
                <RichText
                  className="project__freetext"
                  html={content.Description}
                />
              </div>

              {content.YouTubeId && (
                <PlayerVideo
                  internalSource={null}
                  externalSource={youtubeLink}
                />
              )}
              <PillCollection pillCollection={pillData} />
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
                    GTMecommerce();
                  }}
                  isDisabled={isPaymentSettingsLoading}
                />
              </div>
            </div>

            <div className="project__donations">
              <div className="donation__detail">
                <div className="donation__amount">
                  {content.ShowThermometer && (
                    <>
                      <div className="donation__target">
                        <div className="donation__raised">
                          <h2>Raised</h2>
                          <h3>${convertDonation(content.DonationsReceived)}</h3>
                        </div>
                        <div className="donation__goal">
                          <h2>Goal</h2>
                          <h3>${convertDonation(content.Target)}</h3>
                        </div>
                      </div>

                      <ProgressBar
                        className="progress__bar"
                        completed={
                          projectCompletion < 1 ? '1' : projectCompletion
                        }
                        customLabel=" "
                        bgColor="#037d6e"
                        baseBgColor="#C9C8C7"
                        borderRadius="0"
                        height="8px"
                      />
                    </>
                  )}
                  <Button
                    className={`donation__button ${
                      isPaymentSettingsLoading ? '-disabled' : ''
                    }`}
                    label="Donate Now"
                    id="donate-primary-desktop"
                    type="button"
                    iconName=""
                    isIconOnly={false}
                    onClick={() => {
                      UpdatePath('true', nextRouter);
                      setIsDonationModalOpen(true);
                      setIsRecaptureVisible(false);
                      GTMecommerce();
                    }}
                    isDisabled={isPaymentSettingsLoading}
                  />
                </div>

                {currentDonations.length > 0 && (
                  <>
                    <DonationAccordion
                      title="Recent donations"
                      accordionList={currentDonations}
                      isDonationExpanded={isDonationExpanded}
                      setIsDonationExpanded={setIsDonationExpanded}
                    />

                    {content.Donations.length > 4 && (
                      <Pagination
                        currentPage={currentPage}
                        items={totalPages}
                        itemsToDisplay={4}
                        onPaginationChange={(val) => {
                          paginate(val);
                          setIsDonationExpanded(false);
                        }}
                      />
                    )}
                  </>
                )}
              </div>

              <div className="donation__sharer">
                <h3>Help by sharing this project:</h3>
                <div className="link__and__sharer__container">
                  <div className="copy__link__container">
                    <input
                      disabled
                      value={`${process.env.NEXT_PUBLIC_SITE_URL}${urlPath}`}
                    />

                    <Button
                      type="button"
                      isIconOnly={false}
                      iconName=""
                      label={buttonShareLink}
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${process.env.NEXT_PUBLIC_SITE_URL}${urlPath}`,
                        );
                        handleButtonClick();
                      }}
                    />
                  </div>
                  <div className="social__sharer__container">
                    <SocialShare
                      label="Share this project"
                      hasTwitter
                      hasFacebook
                      hasLinkedIn
                      hasEmail
                    />
                  </div>
                </div>
              </div>
              <Link
                linkLabel="Report fundraiser"
                link="/report-fundraiser"
                iconName="flag-1"
                openNewTab
              />
            </div>
          </div>
          {renderCommunityTabs && (
            <div className={`project__tabs ${loadingTabs ? '-isLoading' : ''}`}>
              {loadingTabs ? (
                <Spinner className="community__tab__spinner" />
              ) : (
                <DonationTabsCollection
                  collection={communityTabContent!}
                  projectDetails={content}
                />
              )}
            </div>
          )}
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
                GTMecommerce();
              }}
              isDisabled={isPaymentSettingsLoading}
            />
          </div>
        </div>
      )}
    </S.Project>
  );
};

export default Project;
