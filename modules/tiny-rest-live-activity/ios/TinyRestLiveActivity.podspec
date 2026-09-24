Pod::Spec.new do |s|
  s.name           = 'TinyRestLiveActivity'
  s.version        = '1.0.0'
  s.summary        = 'TinyRest ActivityKit bridge'
  s.description    = 'Starts, updates, and ends the TinyRest timer Live Activity.'
  s.author         = 'TinyRest'
  s.homepage       = 'https://tinyrest.app'
  s.platform       = :ios, '15.1'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
