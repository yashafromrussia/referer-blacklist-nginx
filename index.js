var fs = require('fs')
var Promise = require('bluebird')
var readFile = Promise.promisify(fs.readFile)
var writeFile = Promise.promisify(fs.writeFile)

// Setup initial file
var nginxConfig = '# /etc/nginx/blacklist.conf\n\n\n'
nginxConfig += 'map $http_referer $bad_referer {\n'
nginxConfig += '\thostnames;\n\n'

// We just need to make the columns even... since default does not have quotes or ~.. remove 3 chars
nginxConfig += '\tdefault' + getSpaces('defa') + '0;\n\n\n'
nginxConfig += '\t# Blacklisted domain names\n'

// Template for all domain names
var domainTemplate = "\t\"~%DOMAIN%\"%SPACES%1;\n"


// Read the blacklisted file in
readFile('./spammers.txt', 'utf-8').then(function(fileContents) {

  // Convert all domain names into an array of domain names
  return fileContents.split('\n')
})
.filter(function(domain) {

  // In case we have empty lines.. filter them out
  return !!domain
})
.map(function(domain) {

  // Append each domain name to the main nginx file
  var spaces = getSpaces(domain)
  nginxConfig += domainTemplate.replace('%DOMAIN%', domain).replace('%SPACES%', spaces)
  return
})
.then(function() {
  nginxConfig += '}'

  return writeFile('referer-blacklist.conf', nginxConfig)
})
.then(function() {
  console.log('All done! Don\'t forget to add \'include blacklist.conf;\' into your http block in \'/etc/nginx/nginx.conf\' file.')
  console.log('Then, to each conf file for your sites, add the following block:\n\nif ($bad_referer) {\n\treturn 444;\n}')
})
.catch(function(err) {
  console.error('Something blew up!', err)
})


// Calculates number of spaces based on domain length
function getSpaces(domain) {
  var spacesNum = 70 - domain.length
  var spaces = ''

  while (spacesNum) {
    spaces += ' '
    spacesNum--
  }

  return spaces
}