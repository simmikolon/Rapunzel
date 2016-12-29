//
//  PauseScene.swift
//  Rapunzel
//
//  Created by Simon Kemper on 18.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class PauseScene: Scene {

    #if os(OSX)
    override func keyDown(with event: NSEvent) {
        
        guard let characters = event.charactersIgnoringModifiers?.characters else { return }
        
        for character in characters {
            //keyEventForwardingDelegate?.handleKeyDownForCharacter(character)
        }
    }
    
    override func keyUp(with event: NSEvent) {
        
        guard let characters = event.charactersIgnoringModifiers?.characters else { return }
        
        for character in characters {
            //keyEventForwardingDelegate?.handleKeyUpForCharacter(character)
        }
    }
    #else

    #endif
}
