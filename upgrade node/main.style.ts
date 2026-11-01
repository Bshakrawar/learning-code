import styled from 'styled-components';

export const BannerFullCard = styled.div`
  height: 465px;

  @media screen and (min-width: 992px) {
    height: 495px;
  }

  &.-cardRight {
    .bannerCommon__content {
      right: 0;
    }
  }

  &.-inverted {
    .bannerCommon__content {
      background: #141414;

      h1,
      p {
        color: #fff;
      }
    }
  }

  .bannerCommon__container {
    height: 465px;
    position: relative;

    @media screen and (min-width: 768px) {
      padding: 0;
    }

    @media screen and (min-width: 992px) {
      height: 495px;
    }

    .button {
      margin-bottom: 0;
    }
  }

  .bannerCommon__content {
    background-color: #fff;
    align-items: flex-start;
    bottom: 32px;
    left: 0;
    padding: 64px 28px 28px;
    position: absolute;
    width: 100%;
    z-index: 1;

    @media screen and (min-width: 768px) {
      padding: 64px 48px 48px;
    }

    @media screen and (min-width: 992px) {
      left: 32px;
      max-width: 50%;
    }

    @media screen and (min-width: 1200px) {
      min-height: 272px;
      top: auto;
    }

    h1 {
      color: var(--text);
      font-family: var(--barlow-condensed);
      font-size: 30px;
      font-weight: 700;
      text-transform: uppercase;

      @media screen and (min-width: 1200px) {
        font-size: 65px;
      }
    }
  }

  .bannerCommon__campaignLogo {
    background-color: #fff;
    border-radius: 50%;
    display: flex;
    height: 100px;
    object-fit: cover;
    overflow: hidden;
    position: absolute;
    top: -50px;
    width: 100px;
  }

  .bannerCommon__image {
    height: 465px;
    position: absolute;
    top: 66px;
    width: 100%;

    @media screen and (min-width: 768px) {
      top: 90px;
    }

    @media screen and (min-width: 992px) {
      height: 495px;
    }

    @media screen and (min-width: 1200px) {
      top: 94px;
    }

    & > div {
     background: ${(props: { bannerColour?: string }) =>
       props.bannerColour ? props.bannerColour : '#141414'};
        props.bannerColour?.toLowerCase() === '#fff' ||
        props.bannerColour?.toLowerCase() === '#ffffff'
          ? '#141414'
          : props.bannerColour ?? '#141414'};
      margin: auto;
      height: 100%;
      max-width: 1400px !important;
    }

    img {
      object-fit: cover;
      object-position: center;
    }
  }

  .bannerCommon__description {
    p {
      margin: 0;
    }
  }

  .donation__button__regular {
    margin-top: 16px;
  }

  .most__impact {
    .bannerCommon__campaignLogo {
      border-radius: 0;
      height: auto;
      position: static;
    }
  }

  .recapture__container {
    background-color: #141414;
    bottom: 5%;
    height: auto;
    left: 0;
    margin: auto;
    max-width: 80%;
    padding: 32px;
    position: fixed;
    right: 0;
    z-index: 20;

    @media screen and (min-width: 992px) {
      bottom: 5%;
      left: auto;
      margin: 0;
      max-width: 450px;
      right: 5%;
    }
  }

  .recapture__heading {
    color: #fff;
    font-family: var(--barlow-condensed);
    font-size: 32px;
    font-weight: 600;
    line-height: 35px; /* 109.375% */
    text-transform: uppercase;
  }

  .recapture__cta__container {
    display: flex;
    flex-direction: column;
    width: 100%;

    @media screen and (min-width: 992px) {
      flex-direction: row;
      gap: 16px;

      button {
        width: auto;
        max-height: 48px;
      }
    }

    button {
      max-height: 48px;
      text-wrap: nowrap;

      &.-secondary.-inverted {
        border: 3px solid var(--primary);
      }
    }
  }
`;
