"use client";

import PageError from '../../../../components/ui/PageError';

export default function Error({ error, reset }) {
  return <PageError error={error} reset={reset} />;
}
