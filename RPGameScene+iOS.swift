//
//  RPGameScene+iOS.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

extension RPGameScene {
    
    var keyboardInputSource: RPKeyboardInputSource {
        return inputManager.inputSource as! RPKeyboardInputSource
    }

    #if os(iOS)

    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        
        for componentSystem in entityManager.componentSystems {
            
            if componentSystem.componentClass == RPInputComponent.self {
         
                for component: GKComponent in componentSystem.components {
                    
                    if let inputComponent: RPInputComponent = component as? RPInputComponent {
                        
                        inputComponent.touchesBegan()
                    }
                }
            }
        }
    }
    
    override func touchesMoved(touches: Set<UITouch>, withEvent event: UIEvent?) {

    }
    
    override func touchesEnded(touches: Set<UITouch>, withEvent event: UIEvent?) {

    }
    
    #else
    
    override func keyDown(event: NSEvent) {
        
        guard let characters = event.charactersIgnoringModifiers?.characters else { return }
        
        for character in characters {
            keyboardInputSource.handleKeyDownForCharacter(character)
        }
    }
    
    override func keyUp(event: NSEvent) {
        
        guard let characters = event.charactersIgnoringModifiers?.characters else { return }
        
        for character in characters {
            keyboardInputSource.handleKeyUpForCharacter(character)
        }
    }
    
    #endif
}
