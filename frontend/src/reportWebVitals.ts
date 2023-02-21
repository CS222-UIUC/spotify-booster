import type { ReportHandler } from 'web-vitals'

// Automatically generated for analytics.
const reportWebVitals = (onPerfEntry?: ReportHandler): void => {
  if ((onPerfEntry != null) && onPerfEntry instanceof Function) {
    void import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry)
      getFID(onPerfEntry)
      getFCP(onPerfEntry)
      getLCP(onPerfEntry)
      getTTFB(onPerfEntry)
    })
  }
}

export default reportWebVitals
