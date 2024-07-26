import React from 'react';
import {
  Image as JssImage,
  Link as JssLink,
  ImageField,
  Field,
  LinkField,
  Text,
  useSitecoreContext,
} from '@sitecore-jss/sitecore-jss-nextjs';

interface Fields {
  siteLogoImage: ImageField;
  siteLogoCaption: Field<string>;
  siteLogoLink: LinkField;
}

export type ImageProps = {
  params: { [key: string]: string };
  fields: Fields;
};

export const SiteLogo = (props: ImageProps): JSX.Element => (
  <div className={`component image ${props.params.styles}`.trimEnd()}>
    <div className="component-content">
      <span className="is-empty-hint">Image</span>
    </div>
  </div>
);

export const Default = (props: ImageProps): JSX.Element => {
  const { sitecoreContext } = useSitecoreContext();

  if (props.fields) {
    const Image = () => <JssImage field={props.fields.siteLogoImage} />;
    const id = props.params.RenderingIdentifier;

    return (
      <div className={`component image ${props.params.styles}`} id={id ? id : undefined}>
        <div className="component-content">
          {sitecoreContext.pageState === 'edit' || !props.fields.siteLogoLink?.value?.href ? (
            <Image />
          ) : (
            <JssLink field={props.fields.siteLogoLink}>
              <Image />
            </JssLink>
          )}
          <Text
            tag="span"
            className="image-caption field-imagecaption"
            field={props.fields.siteLogoCaption}
          />
        </div>
      </div>
    );
  }

  return <SiteLogo {...props} />;
};
