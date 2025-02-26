
sync-upstream:
	git switch main
	git pull --all --prune
	git merge --no-edit upstream/main