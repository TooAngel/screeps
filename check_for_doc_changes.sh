echo \'Checking if documentation changes are included\';
test 0 -ne `git log master..HEAD --name-only --pretty=format: | grep \.md | wc -l`
