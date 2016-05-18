//
//  LifecycleComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 29.04.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

protocol LifecycleComponentDelegate: class {
    func nodeDidExitScreen(node node: SKNode)
}

class LifecycleComponent: GKComponent {

    unowned let node: SKNode
    unowned let delegate: LifecycleComponentDelegate
    
    init(withEntity entity: GKEntity, delegate: LifecycleComponentDelegate) {
        
        guard let renderComponent = entity.componentForClass(RenderComponent) else {
            fatalError()
        }
        
        self.node = renderComponent.node
        self.delegate = delegate
        
        super.init()
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        
        super.updateWithDeltaTime(seconds)
        
        if let position = node.scene?.convertPoint(node.position, fromNode: node.parent!) {
         
            if position.y < 0 {
                
                self.delegate.nodeDidExitScreen(node: node)
            }
        }
    }
}
