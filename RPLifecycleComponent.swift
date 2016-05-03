//
//  RPLifecycleComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 29.04.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

protocol RPLifecycleComponentDelegate: class {
    func nodeDidExitScreen(node node: SKNode)
}

class RPLifecycleComponent: GKComponent {

    unowned let node: SKNode
    unowned let delegate: RPLifecycleComponentDelegate
    
    init(withEntity entity: GKEntity, delegate: RPLifecycleComponentDelegate) {
        
        guard let renderComponent = entity.componentForClass(RPRenderComponent) else {
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
