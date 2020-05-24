`ref/*` taken from [ansiplay](http://artscene.textfiles.com/ansimusic/programs/ansipl20.zip) Copyright 1991, Julie Ibarra  
`doc/mus/*` taken from [textfiles.com](http://artscene.textfiles.com/ansimusic/songs/)

Usage:
```
    import * as ansiplay from "./ansiplay.js";

    if (ansiplay.is_playing()) {
        ansiplay.stop().then(() => ansiplay.play(url));
    } else {
        ansiplay.play(url);
    }
```

Multiple imports will result in multiple voices.
