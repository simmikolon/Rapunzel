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
    
    override func keyDown(theEvent: NSEvent) {
        
        switch theEvent.keyCode {
            
        case 49:
            
            for componentSystem in entityManager.componentSystems {
                
                if componentSystem.componentClass == RPInputComponent.self {
                    
                    for component: GKComponent in componentSystem.components {
                        
                        if let inputComponent: RPInputComponent = component as? RPInputComponent {
                            
                            inputComponent.touchesBegan()
                        }
                    }
                }
            }
            
            break
            
        case 123:
            
            for componentSystem in entityManager.componentSystems {
                
                if componentSystem.componentClass == RPInputComponent.self {
                    
                    for component: GKComponent in componentSystem.components {
                        
                        if let inputComponent: RPInputComponent = component as? RPInputComponent {
                            
                            inputComponent.keyLeftDown()
                        }
                    }
                }
            }
            
            break
            
        case 124:
            
            for componentSystem in entityManager.componentSystems {
                
                if componentSystem.componentClass == RPInputComponent.self {
                    
                    for component: GKComponent in componentSystem.components {
                        
                        if let inputComponent: RPInputComponent = component as? RPInputComponent {
                            
                            inputComponent.keyRightDown()
                        }
                    }
                    
                }
            }
            

            break
            
        default:
            break
        }

    }
    
    override func keyUp(theEvent: NSEvent) {
        
        switch theEvent.keyCode {
            
        case 123:
            
            for componentSystem in entityManager.componentSystems {
                
                if componentSystem.componentClass == RPInputComponent.self {
                    
                    for component: GKComponent in componentSystem.components {
                        
                        if let inputComponent: RPInputComponent = component as? RPInputComponent {
                            
                            inputComponent.keyLeftUp()
                        }
                    }
                }
            }
            
            break
            
        case 124:
            
            for componentSystem in entityManager.componentSystems {
                
                if componentSystem.componentClass == RPInputComponent.self {
                    
                    for component: GKComponent in componentSystem.components {
                        
                        if let inputComponent: RPInputComponent = component as? RPInputComponent {
                            
                            inputComponent.keyRightUp()
                        }
                    }
                }
            }
            
            break
            
        default:
            break
        }
    }
    
    #endif
}
