//
//  Scene.swift
//  Rapunzel
//
//  Created by Simon Kemper on 19.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import UIKit

/*
 Extend `BaseScene` to forward events from the scene to a platform-specific
 control input source. On iOS, this is a `TouchControlInputNode`, which is
 overlaid on the scene to receive touch events.
 */
extension Scene {
    // MARK: Properties
    
    var touchControlInputNode: TouchControlInputNode {
        return sceneManager.inputManager.nativeControlInputSource as! TouchControlInputNode
    }
    
    // MARK: Setup Touch Handling
    
    func addTouchInputToScene() {
        
        // Ensure the touch input source is not associated any other parent.
        touchControlInputNode.removeFromParent()
        
        if self is GameScene {
            // Ensure the control node fills the scene's size.
            touchControlInputNode.size = size
            // Center the control node on the camera.
            touchControlInputNode.position = CGPoint.zero
            
            /*
             Assign a `zPosition` that is above in-game elements, but below the top
             layer where buttons are added.
             */
            touchControlInputNode.zPosition = 40
            
            // Add the control node to the camera node so the controls remain stationary as the camera moves.
            addChild(touchControlInputNode)
        }
    }
}
