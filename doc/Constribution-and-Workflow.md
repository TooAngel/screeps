# My edited suggestion :)

# Contribution [![Issue Count](https://codeclimate.com/github/TooAngel/screeps/badges/issue_count.svg)](https://codeclimate.com/github/TooAngel/screeps)
All kind of contribution is welcome, issues, contact via channels, pull requests.

## Priority
 - Make contribution as easy as possible
 - Easy to understand contribution ideas
 - History looking good, would be nice

## Flow

- Start by forking `TooAngel/screeps`
- Make your own branch off the latest master
- Start a pull request with the prefix [WIP] if you want ongoing reviews during development
- Work on your feature until you think its ready push your commits if you want ongoing reviews
- Rebase your whole feature interactively, using squash or fixup on all merge commits you have made and anything else you would like to edit
- Rebase your feature off latest master
- Test your feature or have someone test it for you, push your commits if you want reviews
- If master has been updated start again from the first `Rebase` step
- Run `npm install` in your repository if you havent already done so, then `grunt dev`
- Push commits
- Remove [WIP] prefix from your pull request
- Await reviews
- If there are issues, prefix the pull request again and start again from first rebase step
- Await merge to master and pray everything works \o/
- Remove the feature branch

# Details
### There is only one eternal branch - master
- All other branches (feature, hotfix, and whatever else you need) are temporary and only used as a convenience to share code with other developers and as a backup measure. They are always removed once the changes present on them land on master.

### Features are integrated onto the master branch without having any merge commits in them
- This ensures linear history.

### Pull Request

- Small PRs are more welcome than big ones and will be merged faster, especially because of the review time. 
- One PR should preferrably only tackle one feature.

### Commits
- One commit should fully tackle one topic, not more not less.

### Work in progress

- You are fine to do on your branch what ever you want. Especially rebasing or squashing before removing the WIP label is expected.
- `--fixup` commits are preferred if you need to commit something that handles the same topic as another one of your commits in your feature or hotfix. These are wither done with the --fixup option for git cli or you can start your commit message with fixup! so they can be combined automatically with the previous or targeted commit on merge or rebase.

## What to do
Have a peak at: [Issues](https://github.com/TooAngel/screeps/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)
These topics are open for discussion, jump in, and also for implementation. The description will reflect the latest status of the
discussion and should end up in the documentation, when finishing the
implementation.