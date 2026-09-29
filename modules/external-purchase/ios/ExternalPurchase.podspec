Pod::Spec.new do |s|
  s.name           = 'ExternalPurchase'
  s.version        = '1.0.0'
  s.summary        = 'StoreKit ExternalPurchaseCustomLink bridge (Japan alternative payments)'
  s.description    = s.summary
  s.license        = 'MIT'
  s.author         = 'kakeizu'
  s.homepage       = 'https://github.com/tsukasa0129/kakeizu'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
