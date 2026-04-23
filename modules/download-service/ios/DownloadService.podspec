require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'DownloadService'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = 'GPL-3.0-or-later'
  s.author         = ''
  s.homepage       = 'https://github.com/theodammaretz/open-rando-mobile'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
